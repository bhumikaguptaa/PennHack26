"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  Banknote,
  CheckCircle2,
  FileCheck,
  Loader2,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { AidCase } from '@/app/lib/store';

export default function StableAidDashboard() {
  const [activeTab, setActiveTab] = useState<'admin' | 'beneficiary'>('admin');
  const [cases, setCases] = useState<AidCase[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin Form State
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');

  // Beneficiary Form State
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [beneficiaryWalletAddress, setBeneficiaryWalletAddress] = useState('');

  // Global UI State
  const [refreshing, setRefreshing] = useState(false);

  const fetchCases = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.cases) setCases(data.cases);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryName, amount, category })
      });
      setBeneficiaryName('');
      setAmount('');
      fetchCases();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCaseId) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/uploadAid', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success) {
        await fetch(`/api/cases/${selectedCaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cid: uploadData.ipfsHash,
            beneficiaryWalletAddress
          })
        });
        setFile(null);
        setSelectedCaseId('');
        setBeneficiaryWalletAddress('');
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseAid = async (caseId: string) => {
    setLoading(true);
    try {
      await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId })
      });
      fetchCases();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-teal-500/30">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-100 to-teal-400 bg-clip-text text-transparent">
              NexusAID
            </h1>
          </div>
          <button
            onClick={fetchCases}
            disabled={refreshing}
            className="text-sm px-4 py-2 rounded-full border border-neutral-700 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all flex items-center gap-2"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Tab Switching */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'admin'
                ? 'bg-neutral-800 text-teal-400 shadow-md border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
                }`}
            >
              <ShieldCheck className="w-5 h-5" />
              NGO Admin
            </button>
            <button
              onClick={() => setActiveTab('beneficiary')}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'beneficiary'
                ? 'bg-neutral-800 text-emerald-400 shadow-md border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
                }`}
            >
              <FileCheck className="w-5 h-5" />
              Beneficiary View
            </button>
          </div>
        </div>

        {/* Action Forms */}
        <div className="mb-16 max-w-xl mx-auto">
          {activeTab === 'admin' ? (
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                Create Aid Case
              </h2>
              <form onSubmit={handleCreateCase} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Beneficiary Name</label>
                  <input
                    required
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    placeholder="e.g. Alice Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Amount (XRP)</label>
                    <input
                      required
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none"
                    >
                      <option>Rent</option>
                      <option>Medical</option>
                      <option>Food</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-neutral-950 font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Allocate Funds'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </span>
                Upload Proof Document
              </h2>
              <form onSubmit={handleUploadProof} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Select Your Case</label>
                  <select
                    required
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a pending case...</option>
                    {cases.filter(c => c.status === 'Pending').map(c => (
                      <option key={c.id} value={c.id}>{c.beneficiaryName} - {c.category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Proof File</label>
                  <div className="border border-dashed border-neutral-700 rounded-xl p-4 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                    <input
                      required
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Destination XRPL Wallet Address</label>
                  <input
                    required
                    type="text"
                    value={beneficiaryWalletAddress}
                    onChange={(e) => setBeneficiaryWalletAddress(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm"
                    placeholder="r... (Testnet Address)"
                  />
                  <p className="text-xs text-neutral-500 mt-2">Funds will be sent to this address upon approval.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !file || !selectedCaseId || !beneficiaryWalletAddress}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Document'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Global Cases Table / Ledger */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/20">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-neutral-200">
              <Banknote className="w-5 h-5 text-neutral-400" />
              Aid Disbursement Ledger
            </h3>
            <span className="text-xs font-mono text-neutral-500 bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">XRPL TESTNET</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-900/50 border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-8 py-4 font-medium">Case Info</th>
                  <th className="px-8 py-4 font-medium">Status</th>
                  <th className="px-8 py-4 font-medium">Pinata Proof CID</th>
                  <th className="px-8 py-4 font-medium">Payment Hash (XRPL)</th>
                  {activeTab === 'admin' && <th className="px-8 py-4 font-medium text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-neutral-500">
                      No aid cases found. Create one in the Admin tab.
                    </td>
                  </tr>
                ) : cases.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-800/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-medium text-neutral-200">{c.beneficiaryName}</div>
                      <div className="text-sm text-neutral-500">{c.amount} XRP • {c.category}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                        ${c.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          c.status === 'Proof Uploaded' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {c.status === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs">
                      {c.cid ? (
                        <a
                          href={`https://gray-implicit-dingo-846.mypinata.cloud/ipfs/${c.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
                        >
                          {c.cid.slice(0, 12)}...{c.cid.slice(-4)}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-neutral-600">Pending Upload</span>
                      )}
                    </td>
                    <td className="px-8 py-5 font-mono text-xs">
                      {c.txHash ? (
                        <a
                          href={`https://testnet.xrpl.org/transactions/${c.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          {c.txHash.slice(0, 16)}...
                        </a>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    {activeTab === 'admin' && (
                      <td className="px-8 py-5 text-right">
                        {c.status === 'Proof Uploaded' && (
                          <button
                            onClick={() => handleReleaseAid(c.id)}
                            disabled={loading}
                            className="text-xs bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white px-4 py-2 rounded-lg border border-blue-500/20 hover:border-blue-500 font-medium transition-all shadow-sm"
                          >
                            Release Aid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
