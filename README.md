# TapGuard - Penn Blockchain Conference Hackathon 2026

![Project Status](https://img.shields.io/badge/Status-Hackathon_Prototype-brightgreen)

TapGuard is an end-to-end, cross-chain cryptocurrency payment solution designed for Point-of-Sale (POS) systems and e-commerce platforms. Built for the Penn Blockchain Hackathon 2026, TapGuard bridges the gap between traditional retail experiences and decentralized finance by enabling seamless, localized crypto payments using NFC technology, as well as an online storefront utilizing TRON network

## 🚀 Features

- **Tap-to-Pay Crypto**: Customers can tap their mobile wallets against the merchant's POS device using NFC (Host Card Emulation) to securely receive payment intents.
- **Cross-Currency Support**: Transactions are executed securely on the backend, supporting the **TRON Nile Testnet** (via TronWeb), with payments in TRX being settled in USDT.
- **Automated DEX Swaps**: Backend integrates directly with SunSwap V2 to swap the customer's native tokens into stablecoins (USDT) for the merchant instantly.
- **Real-Time Websocket Updates**: The POS terminal updates instantly when a transaction clears on the blockchain, providing a web2-like checkout experience.
- **Decentralized E-Commerce**: An integrated online grocery marketplace offering TRX checkouts and USDT settlements.

## 🏗️ Project Architecture

This monorepo consists of four distinct applications:

### 1. `backend` (Node.js / Express)
The central nervous system of the payment flow. Key responsibilities:
- Managing terminal checkout sessions via Socket.IO.
- Handling cross-chain logic with  `TronWeb` for TRON.
- Executing backend-driven stablecoin swaps on SunSwap V2.
- Verifying on-chain transaction logs to finalize payments.

### 2. `mobilePOS` (React Native / Expo)
The merchant's Point-of-Sale terminal.
- Listens to backend Socket.IO events for live checkout status.
- Implements Host Card Emulation (`react-native-hce`) to broadcast the payment payload wirelessly via NFC to the customer.

### 3. `mobileClient` (React Native / Expo)
The customer's crypto wallet app.
- Reads NFC tags emitted by the POS terminal containing the payment intent.
- Interfaces with Web3 wallets via TronLink Pro.
- Signs and broadcasts TRON transactions for completing the payment.

### 4. `marketplace` (Next.js)
A web-based e-commerce storefront for online grocery shopping.
- Built with React 19, Next.js 16, and Tailwind CSS v4.
- Uses Pinata for decentralized data/asset storage.

## 🛠️ Technology Stack

- **Frontend**: Next.js, React Native, Expo, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, Socket.IO.
- **Blockchain**: TronWeb.

## 💻 Running the Project Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- React Native environment setup (Expo Go or simulators)
- Environment variables configured (see `.env.example` in respective directories for API keys, RPC URLs, and Wallet private keys)

### Starting the Backend
```bash
cd backend
npm install
npm start
```

### Starting the Mobile POS Terminal
```bash
cd mobilePOS
npm install
npx expo start
```
*(Run on an Android device to test NFC Host Card Emulation).*

### Starting the Mobile Client Wallet
```bash
cd mobileClient
npm install
npx expo start
```

### Starting the Web Marketplace
```bash
cd marketplace
npm install
npm run dev
```

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details. Built with ❤️ for PennHack26.
