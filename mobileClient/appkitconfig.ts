import '@walletconnect/react-native-compat'
import 'react-native-get-random-values'

import { createAppKit } from '@reown/appkit-react-native'
import { EthersAdapter } from '@reown/appkit-ethers-react-native'
import { baseSepolia } from 'viem/chains'
import { storage } from './StorageUtil'

const projectId = '9e134d6fa8014baa3c381450dd286df0'
const ethersAdapter = new EthersAdapter()

export const appKit = createAppKit({
  projectId,
  networks: [baseSepolia],
  defaultNetwork: baseSepolia,
  adapters: [ethersAdapter],
  storage: storage,
  metadata: {
    name: 'mobileClient',
    description: 'Wallet connect demo',
    url: 'https://example.com',
    icons: ['https://example.com/icon.png'],
    redirect: {
      native: 'mobileclient://',
      universal: 'https://example.com'
    }
  }
})