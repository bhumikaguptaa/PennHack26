// backend/settlement/xrplSettler.js
async function executeXrplSettlement(amountUsd, terminalId) {
  try {
    const treasuryWallet = xrpl.Wallet.fromSeed(process.env.XRPL_TREASURY_SEED);
    const MERCHANT_ADDRESS = process.env.MERCHANT_XRPL_ADDRESS;

    console.log(`[XRPL] Initiating settlement of $${amountUsd} to ${MERCHANT_ADDRESS}...`);

    // Prepare the IOU Payment (RLUSD)
    const paymentTx = {
      TransactionType: "Payment",
      Account: treasuryWallet.address,
      Amount: {
        currency: "USD", // Representing RLUSD for the demo
        value: amountUsd.toString(),
        issuer: treasuryWallet.address // Your backend is the trusted issuer
      },
      Destination: MERCHANT_ADDRESS,
    };

    // Sign and submit to the XRPL Testnet
    const prepared = await xrplClient.autofill(paymentTx);
    const signed = treasuryWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult === "tesSUCCESS") {
      console.log(`[XRPL] Settlement Successful: ${result.result.hash}`);
      
      // FINAL STEP: BROADCAST SUCCESS
      finalizeTransaction(terminalId, result.result.hash);
    }
  } catch (error) {
    console.error("[XRPL] Settlement Failed:", error);
    io.to(terminalId).emit('payment_error', { message: "Settlement failed on XRPL" });
  }
}