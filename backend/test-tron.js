import dotenv from 'dotenv';
dotenv.config();
import { TronWeb } from 'tronweb';

const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.SWAP_WALLET_KEY
});

async function testSwapPath() {
  const routerAddress = 'TDAQGC5Ekd683GjekSaLzCaeg7jGsGSmbh';
  const WTRX = 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a'; 
  const USDT = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'; 
  
  try {
    const res = await tronWeb.transactionBuilder.triggerConstantContract(
      routerAddress,
      'getAmountsOut(uint256,address[])',
      {},
      [
        { type: 'uint256', value: 1000000 }, 
        { type: 'address[]', value: [WTRX, USDT] }
      ],
      process.env.SWAP_WALLET_ADDRESS
    );
    if (res && res.constant_result) {
      console.log("Amounts Out:", res.constant_result);
    } else {
      console.log("No result:", res);
    }
  } catch (e) {
    console.error("Error:", e.message || e);
  }
}
testSwapPath();
