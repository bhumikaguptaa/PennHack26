// /backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// ─────────────────────────────────────────────
// FEATURE FLAG
// ─────────────────────────────────────────────
const USE_TRON = process.env.USE_TRON === 'true';

// ═══════════════════════════════════════════════
// BASE SEPOLIA CONFIG  (old flow, fallback)
// ═══════════════════════════════════════════════
const RLUSD_TOKEN_ADDRESS = "0xbD84621010fF42EB5bF72872BE6ec6FE67Db546f";
const RLUSD_DECIMALS = 18;
const BASE_CHAIN_ID = 84532;

let ethClient = null;
if (!USE_TRON) {
  const { createPublicClient, http } = await import('viem');
  const { baseSepolia } = await import('viem/chains');
  ethClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || undefined),
    pollingInterval: 1_000,
  });
}

// ═══════════════════════════════════════════════
// TRON NILE TESTNET CONFIG
// ═══════════════════════════════════════════════
const TRON_NILE_API = process.env.TRON_NILE_API || 'https://nile.trongrid.io';
const SUNSWAP_ROUTER = process.env.SUNSWAP_ROUTER || 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';
const USDT_TRC20_ADDRESS = process.env.USDT_TRC20_ADDRESS || 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
const WTRX_ADDRESS = process.env.WTRX_ADDRESS || 'TYsbWxNnyTgsZaTFaue9hby3KnDuwFBhwS';

// TRX → USD exchange rate (1 TRX = $X)
const TRX_USD_RATE = parseFloat(process.env.TRX_USD_RATE || '0.25');

// Backend wallet private key — this wallet holds TRX and executes swaps
const SWAP_WALLET_KEY = process.env.SWAP_WALLET_KEY || '';

// ── TronWeb setup ──
let tronWeb = null;
let SWAP_WALLET_ADDRESS = '';

if (USE_TRON) {
  if (!SWAP_WALLET_KEY) {
    console.error("❌ SWAP_WALLET_KEY not set in .env — exiting.");
    process.exit(1);
  }

  const { TronWeb } = await import('tronweb');

  tronWeb = new TronWeb({
    fullHost: TRON_NILE_API,
    privateKey: SWAP_WALLET_KEY,
  });

  SWAP_WALLET_ADDRESS = tronWeb.defaultAddress.base58;
  console.log(`[TRON] Swap wallet: ${SWAP_WALLET_ADDRESS}`);
}

// ═══════════════════════════════════════════════
// SHARED CONFIG
// ═══════════════════════════════════════════════
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS;
const MERCHANT_TRON = process.env.MERCHANT_TRON_ADDRESS;

if (USE_TRON && !MERCHANT_TRON) {
  console.error("❌ MERCHANT_TRON_ADDRESS not set in .env — exiting.");
  process.exit(1);
}
if (!USE_TRON && !MERCHANT_WALLET) {
  console.error("❌ MERCHANT_WALLET_ADDRESS not set in .env — exiting.");
  process.exit(1);
}

// --- SESSION STORE ---
const activeSessions = new Map();

// ─────────────────────────────────────────────
// 1. CHECKOUT ENDPOINT
//    Laptop Kiosk → Backend → POS (via socket)
// ─────────────────────────────────────────────
app.post('/api/checkout', (req, res) => {
  const { amount_usd, terminal_id } = req.body;

  if (!amount_usd || !terminal_id) {
    return res.status(400).json({ error: "Missing amount_usd or terminal_id" });
  }
  if (typeof amount_usd !== 'number' || amount_usd <= 0) {
    return res.status(400).json({ error: "amount_usd must be a positive number" });
  }

  if (USE_TRON) {
    const payment_amt_trx = parseFloat((amount_usd / TRX_USD_RATE).toFixed(6));

    console.log(`[Checkout·TRON] terminal=${terminal_id} | $${amount_usd} = ${payment_amt_trx} TRX → vendor ${MERCHANT_TRON} gets USDT`);

    activeSessions.set(terminal_id, {
      status: 'PENDING',
      amount_usd,
      payment_amt_trx,
      network: 'TRON',
      merchantAddress: MERCHANT_TRON,
      createdAt: Date.now(),
    });

    // NFC payload sent to POS → broadcast via NFC → read by customer's phone
    io.to(terminal_id).emit('payment_intent', {
      payment_amt: amount_usd,
      payment_amt_trx,
      source_currency: 'TRX',
      destination_currency: 'USDT',
      destination_wallet: MERCHANT_TRON,
    });

    return res.json({ success: true, network: 'TRON', terminal_id, amount_usd, payment_amt_trx });
  }

  // ── BASE SEPOLIA ERC-20 PAYLOAD (fallback) ──
  const rawAmount = BigInt(Math.round(amount_usd * 10 ** RLUSD_DECIMALS)).toString();
  console.log(`[Checkout·ETH] terminal=${terminal_id} | $${amount_usd} → ${MERCHANT_WALLET}`);

  activeSessions.set(terminal_id, {
    status: 'PENDING',
    amount_usd,
    rawAmount,
    network: 'BASE_SEPOLIA',
    merchantAddress: MERCHANT_WALLET,
    createdAt: Date.now(),
  });

  io.to(terminal_id).emit('payment_intent', {
    type: 'RLUSD_PAY',
    tokenAddress: RLUSD_TOKEN_ADDRESS,
    to: MERCHANT_WALLET,
    amountRaw: rawAmount,
    amountUsd: amount_usd,
    chainId: BASE_CHAIN_ID,
  });

  res.json({ success: true, network: 'BASE_SEPOLIA', terminal_id, amount_usd, rawAmount });
});

// ─────────────────────────────────────────────
// 2. EXECUTE SWAP — SunSwap V2 (TRX → USDT)
//    Called by mobile client after customer swipes to pay.
//    Backend wallet calls swapExactTRXForTokens on SunSwap V2.
//    USDT output goes DIRECTLY to the vendor's address.
// ─────────────────────────────────────────────
app.post('/api/execute-swap', async (req, res) => {
  if (!USE_TRON || !tronWeb) {
    return res.status(400).json({ error: "TRON mode not active" });
  }

  const { terminal_id } = req.body;

  if (!terminal_id) {
    return res.status(400).json({ error: "Missing terminal_id" });
  }

  const session = activeSessions.get(terminal_id);
  if (!session || session.network !== 'TRON') {
    return res.status(404).json({ error: "No TRON session for this terminal" });
  }

  if (session.status !== 'PENDING') {
    return res.status(400).json({ error: `Session already ${session.status}` });
  }

  session.status = 'SWAPPING';

  try {
    const trxAmountSun = Math.round(session.payment_amt_trx * 1_000_000);

    // Convert addresses to hex for the swap path
    const wtrxHex = tronWeb.address.toHex(WTRX_ADDRESS);
    const usdtHex = tronWeb.address.toHex(USDT_TRC20_ADDRESS);
    const vendorHex = tronWeb.address.toHex(session.merchantAddress);

    // Swap path: WTRX → USDT
    const path = [wtrxHex, usdtHex];

    // Deadline: 5 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 300;

    console.log(`[Swap] Executing: ${session.payment_amt_trx} TRX → USDT → ${session.merchantAddress}`);
    console.log(`[Swap]   SUN value: ${trxAmountSun}`);
    console.log(`[Swap]   Router: ${SUNSWAP_ROUTER}`);
    console.log(`[Swap]   Path: WTRX(${WTRX_ADDRESS}) → USDT(${USDT_TRC20_ADDRESS})`);

    // Call swapExactTRXForTokens on SunSwap V2 Router
    const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
      SUNSWAP_ROUTER,
      'swapExactTRXForTokens(uint256,address[],address,uint256)',
      {
        feeLimit: 100_000_000,     // 100 TRX max fee
        callValue: trxAmountSun,   // TRX sent with the swap
      },
      [
        { type: 'uint256',   value: 0 },            // amountOutMin = 0 (accept any slippage for demo)
        { type: 'address[]', value: path },          // swap path
        { type: 'address',   value: vendorHex },     // USDT goes DIRECTLY to vendor
        { type: 'uint256',   value: deadline },      // deadline
      ],
      SWAP_WALLET_ADDRESS,
    );

    // Sign the transaction with the backend wallet
    const signedTx = await tronWeb.trx.sign(transaction);

    // Broadcast to the TRON network
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTx);

    if (!broadcast.result) {
      throw new Error(`Broadcast failed: ${JSON.stringify(broadcast)}`);
    }

    const txHash = broadcast.txid || transaction.txID;

    console.log(`[Swap] ✅ Broadcast success: ${txHash}`);

    // Wait a moment and check if the transaction was confirmed
    let confirmed = false;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const infoResp = await fetch(`${TRON_NILE_API}/wallet/gettransactioninfobyid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: txHash }),
        });
        const info = await infoResp.json();
        if (info && info.id) {
          confirmed = true;
          if (info.receipt?.result && info.receipt.result !== 'SUCCESS') {
            console.warn(`[Swap] ⚠️ Tx confirmed but result: ${info.receipt.result}`);
          } else {
            console.log(`[Swap] ✅ Confirmed on-chain`);
          }
          break;
        }
      } catch (e) {
        // keep polling
      }
    }

    session.status = 'COMPLETED';
    session.txHash = txHash;

    // Notify POS terminal
    io.to(terminal_id).emit('payment_success', {
      amount: session.amount_usd,
      txHash,
      explorerUrl: `https://nile.tronscan.org/#/transaction/${txHash}`,
    });

    setTimeout(() => activeSessions.delete(terminal_id), 300_000);

    res.json({
      success: true,
      txHash,
      confirmed,
      explorerUrl: `https://nile.tronscan.org/#/transaction/${txHash}`,
    });
  } catch (error) {
    console.error('[Swap] ❌ Error:', error.message || error);
    session.status = 'PENDING'; // Reset so client can retry
    res.status(500).json({ error: "Swap failed", details: error.message });
  }
});

// ─────────────────────────────────────────────
// 3. SESSION STATUS
// ─────────────────────────────────────────────
app.get('/api/session/:terminal_id', (req, res) => {
  const session = activeSessions.get(req.params.terminal_id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({
    terminal_id: req.params.terminal_id,
    status: session.status,
    amount_usd: session.amount_usd,
    network: session.network,
    txHash: session.txHash || null,
  });
});

// ─────────────────────────────────────────────
// 4. HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: USE_TRON ? 'TRON' : 'BASE_SEPOLIA',
    activeSessions: activeSessions.size,
    swapWallet: USE_TRON ? SWAP_WALLET_ADDRESS : undefined,
  });
});

// ─────────────────────────────────────────────
// 5. VERIFY PAYMENT — Base Sepolia (old flow)
// ─────────────────────────────────────────────
app.post('/api/verify-payment', async (req, res) => {
  if (USE_TRON) {
    return res.status(400).json({ error: "Base Sepolia verification disabled — USE_TRON is active." });
  }

  const { txHash, terminal_id } = req.body;

  if (!txHash || !terminal_id) {
    return res.status(400).json({ error: "Missing txHash or terminal_id" });
  }

  const session = activeSessions.get(terminal_id);
  if (!session || session.status !== 'PENDING') {
    return res.status(404).json({ error: "No pending session for this terminal" });
  }

  try {
    const receipt = await ethClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

    if (receipt.status !== 'success') {
      return res.status(400).json({ error: "Transaction reverted" });
    }

    const transferEventSig = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const transferLog = receipt.logs.find(log =>
      log.address.toLowerCase() === RLUSD_TOKEN_ADDRESS.toLowerCase() &&
      log.topics[0] === transferEventSig &&
      log.topics[2] && ('0x' + log.topics[2].slice(26)).toLowerCase() === MERCHANT_WALLET.toLowerCase()
    );

    if (!transferLog) {
      return res.status(400).json({ error: "No matching RLUSD transfer to merchant found in tx" });
    }

    session.status = 'COMPLETED';
    session.txHash = txHash;

    io.to(terminal_id).emit('payment_success', {
      amount: session.amount_usd,
      txHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
    });

    setTimeout(() => activeSessions.delete(terminal_id), 300_000);
    res.json({ success: true, txHash });
  } catch (error) {
    console.error('[Verify·ETH] Error:', error.message);
    res.status(500).json({ error: "Failed to verify transaction" });
  }
});

// ─────────────────────────────────────────────
// 6. SOCKET.IO — Room management
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join_terminal', (terminalId) => {
    socket.join(terminalId);
    console.log(`[Socket] ${socket.id} joined room ${terminalId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// 7. START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ CryptoPay backend running on port ${PORT}`);
  console.log(`   Mode:            ${USE_TRON ? 'TRON (Nile Testnet)' : 'Base Sepolia (ERC-20)'}`);
  if (USE_TRON) {
    console.log(`   Swap wallet:     ${SWAP_WALLET_ADDRESS}`);
    console.log(`   Merchant TRON:   ${MERCHANT_TRON}`);
    console.log(`   SunSwap Router:  ${SUNSWAP_ROUTER}`);
    console.log(`   USDT TRC-20:     ${USDT_TRC20_ADDRESS}`);
    console.log(`   TRX/USD rate:    $${TRX_USD_RATE}`);
  } else {
    console.log(`   Merchant wallet: ${MERCHANT_WALLET}`);
    console.log(`   Token (RLUSD):   ${RLUSD_TOKEN_ADDRESS}`);
    console.log(`   Chain:           Base Sepolia (${BASE_CHAIN_ID})`);
  }
});