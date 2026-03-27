'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import React from 'react';

export function SiteLayoutWrapper({
  children,
  footer
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStableAid = pathname?.startsWith('/stableaid');
  const isEcosystem = pathname?.startsWith('/Ecosystem');
  const isPremium = pathname?.startsWith('/premium');

  if (isStableAid || isEcosystem || isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="bg-[#fdfbfb] text-[#1a1a1a] flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      {footer}
    </div>
  );
}
