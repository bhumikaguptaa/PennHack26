/**
 * tronTxBuilder.ts
 *
 * Builds an unsigned swapExactTRXForTokens transaction targeting
 * SunSwap V2 on the TRON Nile testnet.
 *
 * This module uses TronWeb purely as a JS library to construct
 * the transaction object — NO private key is ever touched here.
 * The unsigned tx is handed off to TronLink for signing.
 */

// @ts-ignore — tronweb doesn't ship proper TS types
import TronWeb from 'tronweb';

// ── TRON Nile Testnet constants ────────────────────────
const NILE_FULL_NODE   = 'https://nile.trongrid.io';
const NILE_SOLIDITY    = 'https://nile.trongrid.io';
const NILE_EVENT       = 'https://event.nileex.io';

// SunSwap V2 Router on Nile
const SUNSWAP_ROUTER_ADDRESS = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';

// Wrapped TRX (WTRX) on Nile — first hop in swap path
const WTRX_ADDRESS = 'TYsbWxNnyTgsZaTFaue9hby3KnDuwFBhwS';

// SunSwap V2 Router ABI fragment for swapExactTRXForTokens
const SWAP_ABI = [
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address' },
      { name: 'deadline',     type: 'uint256' },
    ],
    name: 'swapExactTRXForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
];

// Typed payload that arrives from the NFC tag
export interface TronSwapPayload {
  payment_amt: number;           // amount in TRX (human-readable)
  source_currency: string;       // "TRX"
  destination_currency: string;  // TRC-20 token contract address (e.g. USDT)
  destination_wallet: string;    // vendor's TRON address
}

/**
 * Create a headless TronWeb instance (no private key).
 * Used only for ABI encoding and transaction construction.
 */
function createHeadlessTronWeb(): any {
  return new TronWeb({
    fullHost: NILE_FULL_NODE,
    solidityNode: NILE_SOLIDITY,
    eventServer: NILE_EVENT,
  });
}

/**
 * Build an unsigned swap transaction for SunSwap V2.
 *
 * @param payload  – parsed NFC data
 * @param callerAddress – the user's TRON address (base58)
 * @returns the unsigned transaction object ready for TronLink signing
 */
export async function buildSwapTransaction(
  payload: TronSwapPayload,
  callerAddress: string,
): Promise<{ transaction: any; callValueSun: number }> {
  const tronWeb = createHeadlessTronWeb();

  // Convert TRX → SUN (1 TRX = 1,000,000 SUN)
  const callValueSun = Math.round(payload.payment_amt * 1_000_000);

  // Convert destination addresses from base58 to hex (0x-prefixed)
  const destinationTokenHex = tronWeb.address.toHex(payload.destination_currency);
  const destinationWalletHex = tronWeb.address.toHex(payload.destination_wallet);
  const wtrxHex = tronWeb.address.toHex(WTRX_ADDRESS);

  // Swap path: WTRX → destination token
  const path = [wtrxHex, destinationTokenHex];

  // Deadline: 5 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 300;

  // amountOutMin = 0 for hackathon (accept any slippage)
  const amountOutMin = 0;

  // Build the smart contract call via TronWeb
  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    SUNSWAP_ROUTER_ADDRESS,                    // contract address
    'swapExactTRXForTokens(uint256,address[],address,uint256)', // function selector
    {
      feeLimit: 100_000_000,                   // 100 TRX max fee
      callValue: callValueSun,                 // TRX sent with the call
    },
    [
      { type: 'uint256',   value: amountOutMin },
      { type: 'address[]', value: path },
      { type: 'address',   value: destinationWalletHex },
      { type: 'uint256',   value: deadline },
    ],
    callerAddress,                              // issuer address
  );

  return { transaction, callValueSun };
}

/**
 * Serialize the unsigned transaction to a hex string
 * suitable for deep-link transmission to TronLink.
 */
export function serializeTransaction(transaction: any): string {
  const raw = JSON.stringify(transaction);
  // Convert to hex for URL-safe transport
  return Buffer.from(raw, 'utf-8').toString('hex');
}
