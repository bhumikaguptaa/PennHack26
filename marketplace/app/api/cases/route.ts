import { NextResponse } from 'next/server';
import { inMemoryCases, AidCase, CaseStatus } from '@/app/lib/store';

// GET all cases
export async function GET() {
  return NextResponse.json({ cases: inMemoryCases.sort((a, b) => b.createdAt - a.createdAt) });
}

// POST create a new case
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { beneficiaryName, amount, category } = body;

    if (!beneficiaryName || !amount || !category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newCase: AidCase = {
      id: Math.random().toString(36).substring(2, 9),
      beneficiaryName,
      amount,
      category,
      status: 'Pending',
      createdAt: Date.now(),
    };

    inMemoryCases.push(newCase);
    return NextResponse.json({ success: true, case: newCase });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
