"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export default function TrustBadge({ merchantAddress = "0xMerchantAddress" }: { merchantAddress?: string }) {
    const [trust, setTrust] = useState<any>(null);

    useEffect(() => {
        // Mock fetch if no real backend is up yet, or try to fetch
        fetch(`http://localhost:3001/api/trust/${merchantAddress}`)
            .then(res => res.json())
            .then(data => setTrust(data))
            .catch(err => {
                console.warn("Trust API not ready, using fallback UI", err);
                // Fallback for UI if backend is not up yet
                if (merchantAddress === "0xScamWallet") {
                    setTrust({ score: 12, verdict: 'block' });
                } else {
                    setTrust({ score: 91, verdict: 'safe' });
                }
            });
    }, [merchantAddress]);

    if (!trust) return null; // loading state can be skeleton

    const isSafe = trust.score >= 75;
    const isBlock = trust.score <= 39;
    
    if (isSafe) {
        return (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer hover:bg-emerald-100 transition">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>TapGuard Verified · Score {trust.score}</span>
            </div>
        )
    }

    if (isBlock) {
        return (
            <div className="flex items-center gap-2 bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer hover:bg-red-100 transition">
                <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                <span>High Risk · Score {trust.score}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer hover:bg-amber-100 transition">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Caution · Score {trust.score}</span>
        </div>
    )
}
