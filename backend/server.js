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
// FEATURE FLAG — set USE_TRON=true in .env to
// switch from Base Sepolia ERC-20 → TRON DEX swap
// ─────────────────────────────────────────────
const USE_TRON = process.env.USE_TRON === 'true';

// ═══════════════════════════════════════════════
// BASE SEPOLIA CONFIG  (old flow, fallback)
// ═══════════════════════════════════════════════
const RLUSD_TOKEN_ADDRESS = "0xbD84621010fF42EB5bF72872BE6ec6FE67Db546f";
const RLUSD_DECIMALS = 18;
const BASE_CHAIN_ID = 84532; // Base Sepolia

let ethClient = null;
if (!USE_TRON) {
  // Only import viem when needed
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
// SunSwap V2 router on Nile testnet
const SUNSWAP_ROUTER = process.env.SUNSWAP_ROUTER || 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';
// USDT TRC-20 on Nile testnet
const USDT_TRC20_ADDRESS = process.env.USDT_TRC20_ADDRESS || 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
// Wrapped TRX on Nile
const WTRX_ADDRESS = process.env.WTRX_ADDRESS || 'TYsbWxNnyTgsZaTFaue9hby3KnDuwFBhwS';

// ═══════════════════════════════════════════════
// SHARED CONFIG
// ═══════════════════════════════════════════════
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS;   // EVM (Base Sepolia)
const MERCHANT_TRON = process.env.MERCHANT_TRON_ADDRESS;      // TRON base58

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

function pendingTerminalsForMerchant(merchantAddr) {
  const addr = merchantAddr.toLowerCase();
  const matches = [];
  for (const [terminalId, session] of activeSessions) {
    if (session.status === 'PENDING' && session.merchantAddress.toLowerCase() === addr) {
      matches.push(terminalId);
    }
  }
  return matches;
}

// ─────────────────────────────────────────────
// 1. CHECKOUT ENDPOINT
//    Laptop Kiosk → Backend
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
    // ── TRON DEX SWAP PAYLOAD ──
    console.log(`[Checkout·TRON] terminal=${terminal_id} | ${amount_usd} TRX → ${MERCHANT_TRON}`);

    activeSessions.set(terminal_id, {
      status: 'PENDING',
      amount_usd,
      network: 'TRON',
      merchantAddress: MERCHANT_TRON,
      createdAt: Date.now(),
    });

    io.to(terminal_id).emit('payment_intent', {
      payment_amt: amount_usd,
      source_currency: 'TRX',
      destination_currency: USDT_TRC20_ADDRESS,
      destination_wallet: MERCHANT_TRON,
    });

    return res.json({ success: true, network: 'TRON', terminal_id, amount_usd });
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
// 2. SESSION STATUS ENDPOINT
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
// 3. HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: USE_TRON ? 'TRON' : 'BASE_SEPOLIA', activeSessions: activeSessions.size });
});

// ─────────────────────────────────────────────
// 4. VERIFY PAYMENT — TRON (Nile testnet)
//    Polls TronGrid API for transaction receipt
// ─────────────────────────────────────────────
app.post('/api/verify-tron-payment', async (req, res) => {
  const { txHash, terminal_id } = req.body;

  if (!txHash || !terminal_id) {
    return res.status(400).json({ error: "Missing txHash or terminal_id" });
  }

  const session = activeSessions.get(terminal_id);
  if (!session || session.status !== 'PENDING') {
    return res.status(404).json({ error: "No pending session for this terminal" });
  }

  try {
    // Poll TronGrid for the transaction info (with retries)
    let txInfo = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const resp = await fetch(`${TRON_NILE_API}/wallet/gettransactioninfobyid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: txHash }),
      });
      const data = await resp.json();
      if (data && data.id) {
        txInfo = data;
        break;
      }
      // Wait 3 seconds between retries
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!txInfo) {
      return res.status(408).json({ error: "Transaction not found after polling" });
    }

    if (txInfo.receipt?.result !== 'SUCCESS') {
      return res.status(400).json({ error: "Transaction failed on-chain", result: txInfo.receipt?.result });
    }

    session.status = 'COMPLETED';
    session.txHash = txHash;

    console.log(`[Verified·TRON] terminal=${terminal_id} | tx=${txHash}`);

    io.to(terminal_id).emit('payment_success', {
      amount: session.amount_usd,
      txHash,
      explorerUrl: `https://nile.tronscan.org/#/transaction/${txHash}`,
    });

    setTimeout(() => activeSessions.delete(terminal_id), 300_000);
    res.json({ success: true, txHash });
  } catch (error) {
    console.error('[Verify·TRON] Error:', error.message);
    res.status(500).json({ error: "Failed to verify TRON transaction" });
  }
});

// ─────────────────────────────────────────────
// 5. VERIFY PAYMENT — Base Sepolia (old flow)
//    Gated behind feature flag
// ─────────────────────────────────────────────
app.post('/api/verify-payment', async (req, res) => {
  if (USE_TRON) {
    return res.status(400).json({ error: "Base Sepolia verification disabled — USE_TRON is active. Use /api/verify-tron-payment instead." });
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

    console.log(`[Verified·ETH] terminal=${terminal_id} | tx=${txHash}`);

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
    console.log(`   Merchant TRON:   ${MERCHANT_TRON}`);
    console.log(`   USDT TRC-20:     ${USDT_TRC20_ADDRESS}`);
    console.log(`   SunSwap Router:  ${SUNSWAP_ROUTER}`);
  } else {
    console.log(`   Merchant wallet: ${MERCHANT_WALLET}`);
    console.log(`   Token (RLUSD):   ${RLUSD_TOKEN_ADDRESS}`);
    console.log(`   Chain:           Base Sepolia (${BASE_CHAIN_ID})`);
  }
});