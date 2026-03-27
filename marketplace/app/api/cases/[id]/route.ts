import { NextResponse } from 'next/server';
import { inMemoryCases } from '@/app/lib/store';

export async function PUT(request: Request, context: any) {
  try {
    // Check if context or context.params exists and if it's a promise
    // In next 15+, params is often a Promise
    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { cid, beneficiaryWalletAddress } = body;

    const caseIndex = inMemoryCases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (cid) {
      inMemoryCases[caseIndex].cid = cid;
      inMemoryCases[caseIndex].status = 'Proof Uploaded';
    }
    
    if (beneficiaryWalletAddress) {
      inMemoryCases[caseIndex].beneficiaryWalletAddress = beneficiaryWalletAddress;
    }

    return NextResponse.json({ success: true, case: inMemoryCases[caseIndex] });
  } catch (error) {
    console.error("PUT cases error", error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}
