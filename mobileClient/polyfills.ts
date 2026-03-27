import '@walletconnect/react-native-compat';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// 1. Polyfill Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// 2. Polyfill TextEncoder (The Fix)
import 'fast-text-encoding';