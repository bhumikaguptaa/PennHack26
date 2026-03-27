import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  { id: "breads", name: "Artisan Breads", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&q=80", link: "/menu#breads" },
  { id: "cakes", name: "Cakes", image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=1080&q=80", link: "/menu#cakes" },
  { id: "pastries", name: "Pastries", image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=1080&q=80", link: "/menu#pastries" },
  { id: "drinks", name: "Drinks", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1080&q=80", link: "/menu#drinks" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbfb]">
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src="https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=1080&q=80"
            alt="Baker preparing dough"
            fill
            priority
            className="object-cover opacity-50 transform hover:scale-105 transition-transform duration-[20s] ease-out"
          />
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl text-center">
            Baked with Joy, <br /> Served with Love.
          </h1>
          <p className="text-lg md:text-2xl text-white/95 mb-10 max-w-2xl font-light drop-shadow-xl text-center bg-black/30 p-4 rounded-xl backdrop-blur-sm">
            Experience the rich tradition of artisan baking. Fresh pastries, rustic breads, and fine cakes made daily from scratch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/menu"
              className="px-8 py-4 bg-[#f4dbd8] hover:bg-[#eaccc8] text-[#1a1a1a] font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Ordering <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#categories"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold rounded-full transition-all flex items-center justify-center"
            >
              Explore Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section id="categories" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-4 tracking-tight">Shop by Category</h2>
          <div className="w-24 h-1 bg-[#eaccc8] mx-auto rounded-full mb-6"></div>
          <p className="text-[#3a3a3a] max-w-2xl mx-auto text-lg">
            Whether you are craving a buttery morning pastry or the perfect celebration cake, we have something sweet for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {CATEGORIES.map((cat) => (
            <Link href={cat.link} key={cat.id} className="group relative h-80 w-full overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="font-playfair text-3xl font-bold text-white mb-2 drop-shadow-md">{cat.name}</h3>
                <div className="flex items-center text-[#f4dbd8] font-medium group-hover:underline">
                  Browse <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner*/}
      <section className="bg-[#1a1a1a] py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 text-white text-center md:text-left">
            <h2 className="font-playfair text-4xl mt-2 font-bold mb-6">Baked fresh daily, <br /><span className="text-[#f4dbd8]">just for you.</span></h2>
            <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto md:mx-0 font-light">
              We believe in the power of simple, honest ingredients. That's why everything in our bakery is made from scratch, without preservatives, every single morning.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#f4dbd8] text-[#1a1a1a] hover:bg-[#eaccc8] font-semibold rounded-full shadow-lg transition-all"
            >
              Start Ordering <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="md:w-1/2 relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <Image
              src="/images/cupcake.jpg"
              alt="Fresh ingredients"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
