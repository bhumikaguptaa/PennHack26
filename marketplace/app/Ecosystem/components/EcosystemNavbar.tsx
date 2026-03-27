"use client";

import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function EcosystemNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isDarkPage = pathname === "/Ecosystem/our-ecosystem" || pathname === "/Ecosystem";
    // Determine if we need light text based on scroll and page
    const useLightText = !isScrolled && isDarkPage;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Link href="/Ecosystem" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                        <span className="text-white font-bold text-lg leading-none">R</span>
                    </div>
                    <span className={`font-bold text-xl tracking-tight ${useLightText ? 'text-white' : 'text-gray-900'}`}>Ripple</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    <Link href="#" className={`text-sm font-medium transition-colors ${useLightText ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}>Solutions</Link>
                    <Link href="#" className={`text-sm font-medium transition-colors ${useLightText ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}>Customers</Link>
                    <Link href="#" className={`text-sm font-medium transition-colors ${useLightText ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`}>Company</Link>
                    <Link href="/Ecosystem/our-ecosystem" className={`text-sm font-medium transition-colors ${useLightText ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Our Ecosystem</Link>
                </div>

                <div className="hidden md:flex items-center space-x-5">
                    <button className={`text-sm font-medium transition-colors ${useLightText ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Contact Us</button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        Get Started <ChevronRight size={14} />
                    </button>
                </div>

                <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className={useLightText ? "text-white" : "text-gray-900"} /> : <Menu className={useLightText ? "text-white" : "text-gray-900"} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg p-6 flex flex-col space-y-4 animate-in slide-in-from-top-2">
                    <Link href="#" className="font-medium text-gray-800" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
                    <Link href="#" className="font-medium text-gray-800" onClick={() => setMobileMenuOpen(false)}>Customers</Link>
                    <Link href="#" className="font-medium text-gray-800" onClick={() => setMobileMenuOpen(false)}>Company</Link>
                    <Link href="/Ecosystem/our-ecosystem" className="font-medium text-blue-600" onClick={() => setMobileMenuOpen(false)}>Our Ecosystem</Link>
                    <hr className="my-2 border-gray-100" />
                    <button className="bg-blue-600 text-white px-4 py-3 rounded-full font-medium w-full mt-2 flex justify-center items-center gap-2">
                        Get Started <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </nav>
    );
}
