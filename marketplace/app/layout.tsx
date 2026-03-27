import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";
import { SiteLayoutWrapper } from "./components/SiteLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sweet Treats Bakery Shop",
  description: "A premium bakery marketplace offering fresh artisan breads, cakes, and pastries daily.",
};

function Footer() {
  return (
    <footer className="bg-[#f4dbd8] border-t border-[#eaccc8] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#1a1a1a]">
        <h2 className="font-playfair text-3xl mb-4">Sweet Treats</h2>
        <p className="mb-6 max-w-md mx-auto text-[#3a3a3a]">
          BAKERY SHOP
        </p>
        <div className="flex justify-center space-x-6 mb-8">
          <a href="#" className="hover:text-[#8a5a54] transition font-medium">Instagram</a>
          <a href="#" className="hover:text-[#8a5a54] transition font-medium">Facebook</a>
          <a href="#" className="hover:text-[#8a5a54] transition font-medium">Twitter</a>
        </div>
        <p className="text-sm font-light">© 2026 Sweet Treats Bakery Shop. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <SiteLayoutWrapper footer={<Footer />}>
            {children}
          </SiteLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
