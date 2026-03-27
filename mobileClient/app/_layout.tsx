import "../polyfills"

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TronWalletProvider } from '@/contexts/TronWalletContext';

// Feature flag — keep AppKit available as fallback for Base Sepolia flow
const USE_TRON = true;

// Conditionally import AppKit only when needed
let AppKitProvider: any = null;
let AppKitComponent: any = null;
let appKitInstance: any = null;

if (!USE_TRON) {
  // Dynamic imports would be better, but for RN we use conditional require
  try {
    const appkitRN = require('@reown/appkit-react-native');
    AppKitProvider = appkitRN.AppKitProvider;
    AppKitComponent = appkitRN.AppKit;
    appKitInstance = require('@/appkitconfig').appKit;
  } catch (e) {
    console.warn('AppKit not available — TRON-only mode');
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (USE_TRON) {
    return (
      <SafeAreaProvider>
        <TronWalletProvider>
          <AppContent />
        </TronWalletProvider>
      </SafeAreaProvider>
    );
  }

  // Fallback: AppKit for Base Sepolia
  if (AppKitProvider && appKitInstance) {
    return (
      <SafeAreaProvider>
        <AppKitProvider instance={appKitInstance}>
          <AppContent />
          {AppKitComponent && <AppKitComponent />}
        </AppKitProvider>
      </SafeAreaProvider>
    );
  }

  // Neither available — bare layout
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
