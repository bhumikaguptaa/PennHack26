import { NextResponse } from 'next/server';
import { inMemoryCases } from '@/app/lib/store';
import { Client, xrpToDrops } from 'xrpl';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseId } = body;

    const caseIndex = inMemoryCases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const aidCase = inMemoryCases[caseIndex];
    if (aidCase.status !== 'Proof Uploaded') {
      return NextResponse.json({ error: 'Case not ready for payment' }, { status: 400 });
    }

    if (!aidCase.beneficiaryWalletAddress) {
       return NextResponse.json({ error: 'Beneficiary wallet address not provided' }, { status: 400 });
    }

    console.log(`Starting XRPL Payment for case ${caseId}...`);
    // Connect to Testnet
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();

    console.log("Funding admin wallet...");
    // Generate and fund admin wallet (simulating the NGO's existing treasury)
    const { wallet: adminWallet } = await client.fundWallet();

    console.log(`Sending payment of ${aidCase.amount} XRP to ${aidCase.beneficiaryWalletAddress}...`);
    // Prepare transaction
    const amountXRP = aidCase.amount || "10";
    const payment = {
      TransactionType: "Payment" as const,
      Account: adminWallet.address,
      Amount: xrpToDrops(amountXRP),
      Destination: aidCase.beneficiaryWalletAddress
    };

    const prepared = await client.autofill(payment);
    const signed = adminWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    await client.disconnect();

    const txHash = signed.hash;
    inMemoryCases[caseIndex].status = 'Paid';
    inMemoryCases[caseIndex].txHash = txHash;
    console.log("Payment successful:", txHash);

    return NextResponse.json({ success: true, txHash });

  } catch (error) {
    console.error("Payment error", error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
