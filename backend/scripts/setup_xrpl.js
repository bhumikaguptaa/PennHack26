const xrpl = require("xrpl");

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233"); // XRPL Testnet
  await client.connect();

  console.log("Funding Treasury (Issuer)...");
  const treasury = (await client.fundWallet()).wallet;
  console.log(`Treasury: ${treasury.address} \nSeed: ${treasury.seed}`);

  console.log("Funding Merchant...");
  const merchant = (await client.fundWallet()).wallet;
  console.log(`Merchant: ${merchant.address} \nSeed: ${merchant.seed}`);

  // 1. Merchant creates a "Trust Line" for RLUSD from Treasury
  console.log("Setting up Trust Line...");
  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: merchant.address,
    LimitAmount: {
      currency: "USD", // We use "USD" (standard IOU code) to represent RLUSD
      issuer: treasury.address,
      value: "1000000" // Max amount merchant can hold
    }
  };

  const tsPrepared = await client.autofill(trustSetTx);
  const tsSigned = merchant.sign(tsPrepared);
  const tsResult = await client.submitAndWait(tsSigned.tx_blob);
  
  if (tsResult.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ Trust Line Established! Merchant can now receive RLUSD.");
    console.log(`SAVE THESE SEEDS IN YOUR .ENV FILE!`);
  } else {
    console.error("Trust Set Failed:", tsResult);
  }

  client.disconnect();
}

main();