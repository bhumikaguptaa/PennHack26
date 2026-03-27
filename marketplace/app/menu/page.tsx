"use client";

// import removed
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart, CartItem } from "../context/CartContext";
import Link from 'next/link';
import { useEffect, useState } from "react";

const MENU_CATEGORIES = [
    {
        id: "produce",
        name: "Fresh Produce",
        items: [
            { id: "pr1", name: "Organic Honeycrisp Apples", price: 6.99, image: "/images/item_apples_1774634605560.png", description: "Crisp, sweet, and locally sourced." },
            { id: "pr2", name: "Haas Avocados (3-pack)", price: 4.5, image: "/images/item_avocados_1774634628809.png", description: "Ripe and ready for guacamole." },
            { id: "pr3", name: "Organic Spinach", price: 3.99, image: "/images/item_spinach_1774634642317.png", description: "Fresh washed baby spinach leaves." },
        ]
    },
    {
        id: "meat",
        name: "Meat & Seafood",
        items: [
            { id: "m1", name: "Wagyu Ribeye Steak", price: 45.0, image: "/images/item_steak_1774634665559.png", description: "Premium A5 Wagyu cut, perfectly marbled." },
            { id: "m2", name: "Atlantic Salmon Fillet", price: 18.5, image: "/images/item_salmon_1774634688850.png", description: "Freshly caught, sustainably raised." },
            { id: "m3", name: "Free-Range Chicken Breast", price: 12.0, image: "/images/item_chicken_1774634711864.png", description: "Boneless, skinless, organic chicken." },
        ]
    },
    {
        id: "dairy",
        name: "Dairy & Eggs",
        items: [
            { id: "d1", name: "Farm-Fresh Eggs (Dozen)", price: 5.99, image: "/images/item_eggs_1774634735495.png", description: "Pasture-raised, Grade A large eggs." },
            { id: "d2", name: "Organic Whole Milk", price: 4.5, image: "/images/item_milk_1774634752141.png", description: "Grass-fed cow's milk, half gallon." },
            { id: "d3", name: "Aged Cheddar Block", price: 8.0, image: "/images/item_cheddar_1774634764184.png", description: "Sharp cheddar aged for 24 months." },
        ]
    },
    {
        id: "pantry",
        name: "Pantry Staples",
        items: [
            { id: "pa1", name: "Extra Virgin Olive Oil", price: 14.99, image: "/images/item_oliveoil_1774634782678.png", description: "Cold-pressed, Mediterranean origin." },
            { id: "pa2", name: "Organic Whole Bean Coffee", price: 16.5, image: "/images/item_coffee_1774634805048.png", description: "Fair-trade dark roast." },
            { id: "pa3", name: "Jasmine Rice (5 lbs)", price: 9.99, image: "/images/item_rice_1774634817492.png", description: "Premium long-grain fragrant rice." },
        ]
    }
];

export default function MenuPage() {
    const { cart, addToCart, removeFromCart, totalPrice, totalItems } = useCart();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleAddToCart = (item: any) => {
        const cartItem: CartItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
        };
        addToCart(cartItem);
    };

    return (
        <div className="min-h-screen bg-[#fdfbfb] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Category Header Links */}
                <div className="sticky top-20 z-40 bg-[#fdfbfb]/95 backdrop-blur-md py-4 border-b border-[#a7f3d0] mb-10 overflow-x-auto whitespace-nowrap">
                    <div className="flex gap-6 justify-center text-[#1a1a1a]">
                        {MENU_CATEGORIES.map(cat => (
                            <a key={cat.id} href={`#${cat.id}`} className="font-playfair text-xl hover:text-[#059669] font-bold transition-colors">
                                {cat.name}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Menu Items List */}
                    <div className="lg:w-2/3">
                        {MENU_CATEGORIES.map((category) => (
                            <div key={category.id} id={category.id} className="mb-16 scroll-mt-32">
                                <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-8 border-b border-[#a7f3d0] pb-4">{category.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-[#d1fae5] overflow-hidden transition-all duration-300 flex flex-col group">
                                            <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-in-out"
                                                />
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-playfair text-xl font-bold text-[#1a1a1a]">{item.name}</h3>
                                                    <span className="font-semibold text-[#059669]">${item.price.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[#3a3a3a] text-sm mb-6 flex-grow">{item.description}</p>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#059669] font-bold rounded-xl transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" /> Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Sidebar */}
                    {isClient && (
                        <div className="lg:w-1/3">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#d1fae5] sticky top-36">
                                <h3 className="font-playfair text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center justify-between">
                                    Your Cart
                                    <span className="bg-[#d1fae5] text-[#059669] text-sm py-1 px-3 rounded-full font-semibold">{totalItems} items</span>
                                </h3>

                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-[#059669]">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">Your cart is empty.</p>
                                        <p className="text-sm mt-1">Start shopping for fresh goods!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                                            {cart.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center group bg-[#fdfbfb] p-3 rounded-xl border border-[#d1fae5]">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-[#1a1a1a] text-sm truncate pr-2">{item.name}</p>
                                                        <p className="text-[#059669] font-medium text-xs">${item.price.toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-[#a7f3d0] px-2 py-1">
                                                            <span className="text-sm font-bold text-[#1a1a1a] w-4 text-center">{item.quantity}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-[#a7f3d0] pt-4 space-y-3 mb-6">
                                            <div className="flex justify-between text-[#3a3a3a]">
                                                <span>Subtotal</span>
                                                <span className="font-medium">${totalPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-xl text-[#059669] pt-2">
                                                <span>Total (Est.)</span>
                                                <span>${(totalPrice * 1.08).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/checkout"
                                            className="w-full py-4 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            Proceed to Checkout <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
