/**
 * TronWalletContext.tsx
 *
 * Global state for TronLink wallet connection on Android.
 * Persists the connected TRON address in AsyncStorage.
 *
 * Connection flow:
 * 1. User taps "Connect Wallet"
 * 2. We fire a deep link to TronLink: tronlinkoutside://pull.activity
 * 3. User authorises in TronLink → OS returns to our app
 * 4. User pastes / we read back their TRON address (manual entry
 *    for hackathon — TronLink doesn't provide a callback with address)
 *
 * For the hackathon demo, we also support direct address entry.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tron_wallet_address';
const TRON_NILE_API = 'https://nile.trongrid.io';

interface TronWalletState {
  address: string | null;
  isConnected: boolean;
  balance: string | null;
  balanceLoading: boolean;
  connect: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  launchTronLinkConnect: () => Promise<boolean>;
}

const TronWalletContext = createContext<TronWalletState>({
  address: null,
  isConnected: false,
  balance: null,
  balanceLoading: false,
  connect: async () => { },
  disconnect: async () => { },
  refreshBalance: async () => { },
  launchTronLinkConnect: async () => false,
});

export function useTronWallet() {
  return useContext(TronWalletContext);
}

/**
 * Fetch TRX balance from Nile testnet
 */
async function fetchTrxBalance(address: string): Promise<string> {
  try {
    const resp = await fetch(`${TRON_NILE_API}/v1/accounts/${address}`, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await resp.json();
    if (data?.data?.[0]?.balance) {
      // Balance is in SUN, convert to TRX
      const sun = data.data[0].balance;
      return (sun / 1_000_000).toFixed(2);
    }
    return '0.00';
  } catch (error) {
    console.warn('[TronWallet] Balance fetch error:', error);
    return '0.00';
  }
}

/**
 * Validate a TRON address (base58, starts with T, 34 chars)
 */
function isValidTronAddress(addr: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}

export function TronWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Load persisted address on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && isValidTronAddress(stored)) {
        setAddress(stored);
      }
    });
  }, []);

  // Fetch balance when address changes
  useEffect(() => {
    if (address) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [address]);

  const connect = useCallback(async (addr: string) => {
    const trimmed = addr.trim();
    if (!isValidTronAddress(trimmed)) {
      Alert.alert('Invalid Address', 'Please enter a valid TRON address (starts with T, 34 characters).');
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    setAddress(trimmed);
  }, []);

  const disconnect = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAddress(null);
    setBalance(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      const bal = await fetchTrxBalance(address);
      setBalance(bal);
    } finally {
      setBalanceLoading(false);
    }
  }, [address]);

  const launchTronLinkConnect = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'TronLink Pro deep link is only supported on Android.');
      return false;
    }

    // TronLink Pro may register under different URI schemes.
    // Try them in order: tronlinkoutside → tronlink → direct package intent
    const schemes = [
      'tronlinkoutside://pull.activity?param=' + encodeURIComponent(JSON.stringify({ action: 'open' })),
      'tronlink://pull.activity?param=' + encodeURIComponent(JSON.stringify({ action: 'open' })),
      // Android package-based intent as last resort
      'intent://#Intent;package=com.tronlinkpro.wallet;end',
    ];

    for (const deepLink of schemes) {
      try {
        const canOpen = await Linking.canOpenURL(deepLink);
        if (canOpen) {
          await Linking.openURL(deepLink);
          return true;
        }
      } catch (e) {
        console.warn(`[TronWallet] Scheme failed: ${deepLink}`, e);
      }
    }

    // If none of the canOpenURL checks passed, try opening directly anyway
    // (canOpenURL can be unreliable on some Android versions)
    try {
      await Linking.openURL(schemes[0]);
      return true;
    } catch (error) {
      console.error('[TronWallet] All deep link attempts failed:', error);
      Alert.alert(
        'TronLink Pro Not Found',
        'Please install TronLink Pro from the Google Play Store and try again.',
      );
      return false;
    }
  }, []);

  return (
    <TronWalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        balance,
        balanceLoading,
        connect,
        disconnect,
        refreshBalance,
        launchTronLinkConnect,
      }}
    >
      {children}
    </TronWalletContext.Provider>
  );
}
