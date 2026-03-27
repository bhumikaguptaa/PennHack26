"use client";

// import removed
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "./context/CartContext";

const CATEGORIES = [
  { id: "produce", name: "Fresh Produce", image: "/images/produce.jpg", link: "/menu#produce" },
  { id: "meat", name: "Meat & Seafood", image: "/images/meat.jpg", link: "/menu#meat" },
  { id: "dairy", name: "Dairy & Eggs", image: "/images/dairy.jpg", link: "/menu#dairy" },
  { id: "pantry", name: "Pantry Staples", image: "/images/pantry.jpg", link: "/menu#pantry" },
];

export default function Home() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart when returning to the home page
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbfb]">
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
            <img
              src="/images/hero.jpg"
            alt="Fresh colorful vegetables"
            className="w-full h-full object-cover opacity-60 transform hover:scale-105 transition-transform duration-[20s] ease-out"
          />
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl text-center">
            Fresh Foods, <br /> Daily Delivery.
          </h1>
          <p className="text-lg md:text-2xl text-white/95 mb-10 max-w-2xl font-light drop-shadow-xl text-center bg-black/30 p-4 rounded-xl backdrop-blur-sm">
            Experience the finest selection of organic produce, premium cuts of meat, and daily household essentials straight to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/menu"
              className="px-8 py-4 bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#059669] font-bold rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#categories"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold rounded-full transition-all flex items-center justify-center"
            >
              Explore Aisles
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section id="categories" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-4 tracking-tight">Shop the Aisles</h2>
          <div className="w-24 h-1 bg-[#34d399] mx-auto rounded-full mb-6"></div>
          <p className="text-[#3a3a3a] max-w-2xl mx-auto text-lg">
            Whether you are picking up crisp morning greens or a hearty prime rib for dinner, we have the best quality groceries ready for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {CATEGORIES.map((cat) => (
            <Link href={cat.link} key={cat.id} className="group relative h-80 w-full overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="font-playfair text-3xl font-bold text-white mb-2 drop-shadow-md">{cat.name}</h3>
                <div className="flex items-center text-[#d1fae5] font-medium group-hover:underline">
                  Browse <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner*/}
      <section className="bg-[#064e3b] py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 text-white text-center md:text-left">
            <h2 className="font-playfair text-4xl mt-2 font-bold mb-6">Sourced responsibly, <br /><span className="text-[#6ee7b7]">freshly delivered.</span></h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-lg mx-auto md:mx-0 font-light">
              We partner directly with local farms and trusted suppliers. That's why everything in our grocery selection is guaranteed crisp, ethical, and wholesome.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#10b981] text-white hover:bg-[#059669] font-bold rounded-full shadow-lg transition-all"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="md:w-1/2 relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl border border-emerald-800">
            <img
              src="/images/banner.jpg"
              alt="Fresh fruit basket"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
