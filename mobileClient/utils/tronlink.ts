/**
 * tronlink.ts
 *
 * Deep-link integration with TronLink Android app.
 * Encodes an unsigned transaction and fires it via
 * the `tronlinkoutside://` URI scheme.
 *
 * Also provides a polling helper that watches TronGrid
 * for a confirmed transaction from the user's address.
 */

import { Linking, Platform } from 'react-native';
import { serializeTransaction } from './tronTxBuilder';

const TRON_NILE_API = 'https://nile.trongrid.io';

// ── TronLink Deep Link ─────────────────────────────────

/**
 * Launch TronLink with an unsigned transaction for signing.
 *
 * TronLink Android supports the `tronlinkoutside://` scheme.
 * We encode the unsigned tx as a JSON param in the deep link.
 *
 * @param unsignedTx — the raw transaction object from TronWeb
 * @param dappName   — your app name shown in TronLink's prompt
 */
export async function launchTronLink(
  unsignedTx: any,
  dappName: string = 'CryptoPay',
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.warn('[TronLink] Deep link only supported on Android');
    return false;
  }

  try {
    // Serialize the unsigned tx to hex
    const txHex = serializeTransaction(unsignedTx);

    // Build the deep link URI
    // TronLink's `pull.activity` scheme accepts a JSON-encoded param
    const params = JSON.stringify({
      action: 'sign',
      transaction: txHex,
      dappName,
      dappIcon: '',
      callbackUrl: 'mobileclient://tronlink-callback',
    });

    const encodedParams = encodeURIComponent(params);
    const deepLink = `tronlinkoutside://pull.activity?param=${encodedParams}`;

    const canOpen = await Linking.canOpenURL(deepLink);
    if (!canOpen) {
      console.error('[TronLink] TronLink app is not installed');
      return false;
    }

    await Linking.openURL(deepLink);
    return true;
  } catch (error) {
    console.error('[TronLink] Failed to launch deep link:', error);
    return false;
  }
}

// ── Transaction Polling ────────────────────────────────

export interface PollResult {
  found: boolean;
  txHash?: string;
  receipt?: any;
}

/**
 * Poll the Nile testnet for the most recent transaction
 * from the given address. Checks every `intervalMs` for
 * up to `maxAttempts` times.
 *
 * This is used after TronLink signs & broadcasts the tx —
 * we don't get a direct callback, so we watch the mempool.
 *
 * @param fromAddress   — user's TRON address (base58)
 * @param afterTimestamp — only consider txns after this UNIX ms timestamp
 * @param intervalMs    — poll interval (default 3s)
 * @param maxAttempts   — max poll count (default 40 = 2 minutes)
 */
export async function pollForTransaction(
  fromAddress: string,
  afterTimestamp: number,
  intervalMs: number = 3000,
  maxAttempts: number = 40,
): Promise<PollResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Query TronGrid for recent transactions from this address
      const resp = await fetch(
        `${TRON_NILE_API}/v1/accounts/${fromAddress}/transactions?limit=5&order_by=block_timestamp,desc`,
        {
          headers: { 'Accept': 'application/json' },
        },
      );
      const data = await resp.json();

      if (data?.data?.length) {
        // Find a transaction newer than our start timestamp
        const recentTx = data.data.find(
          (tx: any) => tx.block_timestamp > afterTimestamp,
        );

        if (recentTx) {
          const txHash = recentTx.txID;

          // Fetch full transaction info for receipt
          const infoResp = await fetch(`${TRON_NILE_API}/wallet/gettransactioninfobyid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: txHash }),
          });
          const txInfo = await infoResp.json();

          return {
            found: true,
            txHash,
            receipt: txInfo,
          };
        }
      }
    } catch (error) {
      console.warn(`[TronLink·Poll] Attempt ${attempt + 1} error:`, error);
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return { found: false };
}
