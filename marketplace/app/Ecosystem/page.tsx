import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
    title: "Ripple - Global Crypto Solutions for Business",
    description: "Breakthrough Crypto Solutions for a World Without Economic Borders.",
};

export default function Home() {
    return (
        <main className="min-h-screen bg-[#020617] text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-screen"></div>
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-medium mb-8">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        The Future of Finance is Here
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]">
                        Global Crypto Solutions for <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Transformative Business
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12">
                        Join the Internet of Value. Ripple connects banks, payment providers and digital asset exchanges to provide one frictionless experience to send money globally.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/Ecosystem/our-ecosystem" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            Explore Our Ecosystem <ArrowRight size={18} />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium transition-all text-white backdrop-blur-sm">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-white/10 bg-[#020617]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
                        <div className="text-center px-4">
                            <h3 className="text-4xl font-bold text-white mb-2">300+</h3>
                            <p className="text-gray-400 text-sm py-1">Customers Worldwide</p>
                        </div>
                        <div className="text-center px-4">
                            <h3 className="text-4xl font-bold text-white mb-2">55+</h3>
                            <p className="text-gray-400 text-sm py-1">Countries Supported</p>
                        </div>
                        <div className="text-center px-4">
                            <h3 className="text-4xl font-bold text-white mb-2">120+</h3>
                            <p className="text-gray-400 text-sm py-1">Fiat Pairs</p>
                        </div>
                        <div className="text-center px-4">
                            <h3 className="text-4xl font-bold text-blue-400 mb-2">3s</h3>
                            <p className="text-gray-400 text-sm py-1">Settlement Time</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
