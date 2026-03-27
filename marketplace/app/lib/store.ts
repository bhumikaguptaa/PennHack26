export type CaseStatus = 'Pending' | 'Proof Uploaded' | 'Paid';

export type AidCase = {
  id: string;
  beneficiaryName: string;
  amount: string; // in XRP
  category: string;
  status: CaseStatus;
  cid?: string;
  txHash?: string;
  beneficiaryWalletAddress?: string; // Where the funds will be sent upon release
  createdAt: number;
};

declare global {
  var globalCases: AidCase[] | undefined;
}

export const inMemoryCases: AidCase[] = global.globalCases || [];

if (process.env.NODE_ENV !== 'production') {
  global.globalCases = inMemoryCases;
}
