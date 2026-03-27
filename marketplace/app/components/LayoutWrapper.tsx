"use client";

import { usePathname } from "next/navigation";
import { Navbar as BakeryNavbar } from "./Navbar";

export function LayoutWrapper({ children, Footer }: { children: React.ReactNode, Footer: React.ReactNode }) {
    const pathname = usePathname();
    const isEcosystem = pathname?.startsWith("/Ecosystem");

    if (isEcosystem) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <BakeryNavbar />
            <main className="flex-grow pt-20">
                {children}
            </main>
            {Footer}
        </>
    );
}
