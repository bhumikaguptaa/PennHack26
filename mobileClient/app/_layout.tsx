import "../polyfills"


import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppKitProvider, AppKit } from '@reown/appkit-react-native'
import {appKit} from '@/appkitconfig'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';




import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ethersAdapter = new EthersAdapter();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appKit}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    <AppKit />
    </AppKitProvider>
    </SafeAreaProvider>
  );
}
