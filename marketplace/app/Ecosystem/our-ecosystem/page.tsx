'use client'
import { ArrowRight, Smartphone, ShieldCheck, Send, RefreshCw, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

const products = [
    {
        id: "pos",
        title: "NexusPay (Tap to Pay)",
        subtitle: "Built by Us • Powered by Crypto",
        description: "Transform any mobile device into a powerful point-of-sale terminal. Accept crypto payments just like standard contactless cards with instant settlement and negligible fees.",
        icon: Smartphone,
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1000&auto=format&fit=crop",
        color: "from-emerald-500 to-teal-400",
        link: "/"
    },
    {
        id: "stableaid",
        title: "NexusAID",
        subtitle: "Stability Meets Utility",
        description: "A radical transparency module that ensures every decimal of a donation reaches its intended destination without administrative leakage. It leverages immutable ledgers to give donors real-time proof of impact and verified fund routing.",
        icon: ShieldCheck,
        image: "/charity.jpg",
        color: "from-blue-500 to-cyan-400",
        link: "/stableaid"
    },
    {
        id: "p2p",
        title: "P2P Transfers",
        subtitle: "Like Venmo, But Borderless Crypto",
        description: "Send value anywhere to person in your contact instantly using just a phone number or email. Forget complex wallet addresses. Fast, free, and secure peer-to-peer crypto transfers.",
        icon: Send,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
        color: "from-purple-500 to-pink-400",
        link: "<nolink>"
    },
    {
        id: "forex",
        title: "Forex",
        subtitle: "On-Demand Liquidity",
        description: "A borderless liquidity engine that dissolves traditional banking delays and high conversion fees. It enables the instant, frictionless flow of value across global jurisdictions using unified digital ledger technology.",
        icon: RefreshCw,
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
        color: "from-orange-500 to-amber-400",
        link: "<nolink>"
    },
    {
        id: "loans",
        title: "Loans",
        subtitle: "Unlock Capital Defi-Style",
        description: "DeFi-powered lending pools that allow users to unlock instant liquidity by collateralizing their digital assets. These smart-contract-driven credit lines eliminate the need for traditional credit scores or predatory middleman approvals.",
        icon: Landmark,
        image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=1000&auto=format&fit=crop",
        color: "from-indigo-500 to-blue-500",
        link: "<nolink>"
    }
];

export default function OurEcosystem() {
    const router = useRouter();
    return (
        <main className="min-h-screen bg-[#020617] text-white pt-10">
            {/* Ecosystem Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 mt-10">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Ecosystem</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        A comprehensive suite of interconnected products replacing legacy finance with a real-time, global, crypto-native alternative.
                    </p>
                </div>
            </section>

            {/* Sections */}
            <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 hidden lg:block -translate-x-1/2 z-0"></div>
                {products.map((product, index) => {
                    const isEven = index % 2 === 0;
                    return (
                        <section key={product.id} id={product.id} className="relative py-24 lg:py-32 z-10 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-500 hover:border-white/10 group/section">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}>

                                    {/* Text Content */}
                                    <div className="w-full lg:w-1/2 flex flex-col items-start text-left relative">
                                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl -z-10 opacity-0 group-hover/section:opacity-100 transition-opacity duration-700"></div>

                                        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 bg-gradient-to-br ${product.color} opacity-90`}>
                                            <product.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 text-gray-300">
                                            {product.subtitle}
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                                            {product.title}
                                        </h2>
                                        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                            {product.description}
                                        </p>
                                        <button onClick={() => { router.push(product.link) }} className="flex items-center gap-2 text-white font-medium hover:text-blue-400 transition-colors group cursor-pointer">
                                            Learn more <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>

                                    {/* Image/Visual */}
                                    <div className="w-full lg:w-1/2 relative group perspective">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-20 blur-3xl transition-opacity group-hover:opacity-40 -z-10`}></div>
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:rotate-1 group-hover:scale-[1.02] ring-1 ring-white/10">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent z-10 opacity-60 mix-blend-multiply"></div>
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </section>
                    )
                })}
            </div>

            {/* CTA */}
            <section className="py-24 relative overflow-hidden bg-blue-900/10">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2000')] bg-cover bg-center opacity-5 mix-blend-screen -z-10"></div>
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to join the ecosystem?</h2>
                    <p className="text-gray-400 mb-10 text-lg md:text-xl">Integrate once, access the world. Build the future of finance with our suite of enterprise solutions.</p>
                    <button className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold transition-all shadow-xl shadow-white/10 text-lg">
                        Start Building Today
                    </button>
                </div>
            </section>
        </main>
    );
}
