import { EcosystemNavbar } from "./components/EcosystemNavbar";

export default function EcosystemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="font-sans antialiased bg-[#020617] text-white min-h-screen">
            <EcosystemNavbar />
            {children}
        </div>
    );
}
