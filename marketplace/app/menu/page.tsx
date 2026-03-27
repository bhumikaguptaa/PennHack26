"use client";

import Image from "next/image";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart, CartItem } from "../context/CartContext";
import Link from 'next/link';
import { useEffect, useState } from "react";

const MENU_CATEGORIES = [
    {
        id: "breads",
        name: "Artisan Breads",
        items: [
            { id: "b1", name: "Rustic Sourdough", price: 8.0, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80", description: "Naturally leavened with our 10-year-old starter." },
            { id: "b2", name: "Rosemary Focaccia", price: 6.5, image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&q=80", description: "Olive oil rich flatbread topped with fresh rosemary and sea salt." },
            { id: "b3", name: "Whole Wheat Loaf", price: 7.0, image: "https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&q=80", description: "Hearty and nutritious, perfect for morning toast." },
        ]
    },
    {
        id: "cakes",
        name: "Cakes",
        items: [
            { id: "c1", name: "Vanilla Bean Layer Cake", price: 45.0, image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&q=80", description: "Light Madagascar vanilla sponge with Swiss meringue buttercream." },
            { id: "c2", name: "Strawberry Shortcake", price: 48.0, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80", description: "Layers of vanilla sponge, fresh strawberries, and whipped cream." },
            { id: "c3", name: "Rich Chocolate Fudge", price: 50.0, image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80", description: "Decadent dark chocolate layers separated by fudge icing." },
            { id: "c4", name: "Lemon Raspberry Cake", price: 46.0, image: "https://images.unsplash.com/photo-1602351447937-745cb720612f?w=800&q=80", description: "Zesty lemon cake filled with fresh raspberry compote." },
        ]
    },
    {
        id: "pastries",
        name: "Pastries",
        items: [
            { id: "p1", name: "Classic Butter Croissant", price: 4.5, image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=800&q=80", description: "Flaky and buttery, crafted with European butter." },
            { id: "p2", name: "Almond Croissant", price: 5.5, image: "https://images.unsplash.com/photo-1691480162735-9b91238080f6?w=800&q=80", description: "Twice-baked and filled with sweet almond frangipane." },
            { id: "p3", name: "Pain au Chocolat", price: 5.0, image: "https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=800&q=80", description: "Classic dough enveloping dark chocolate batons." },
            { id: "p4", name: "Fruit Danish", price: 4.8, image: "https://images.unsplash.com/photo-1681218079567-35aef7c8e7e4?w=800&q=80", description: "Seasonal fruit atop a creamy custard base inside flaky pastry." },
        ]
    },
    {
        id: "drinks",
        name: "Drinks",
        items: [
            { id: "d1", name: "Artisan Espresso", price: 3.5, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80", description: "Double shot of our house-roasted origin blend." },
            { id: "d2", name: "Vanilla Latte", price: 5.0, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80", description: "Espresso with steamed milk and house-made vanilla syrup." },
            { id: "d3", name: "Matcha Green Tea", price: 5.5, image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80", description: "Ceremonial grade matcha blended beautifully with oat milk." },
            { id: "d4", name: "Fresh Squeezed OJ", price: 4.0, image: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800&q=80", description: "Cold-pressed oranges, squeezed to order." },
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
                <div className="sticky top-20 z-40 bg-[#fdfbfb]/95 backdrop-blur-md py-4 border-b border-[#eaccc8] mb-10 overflow-x-auto whitespace-nowrap">
                    <div className="flex gap-6 justify-center text-[#1a1a1a]">
                        {MENU_CATEGORIES.map(cat => (
                            <a key={cat.id} href={`#${cat.id}`} className="font-playfair text-xl hover:text-[#8a5a54] font-bold transition-colors">
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
                                <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-8 border-b border-[#eaccc8] pb-4">{category.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-[#f4dbd8] overflow-hidden transition-all duration-300 flex flex-col group">
                                            <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                                                />
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-playfair text-xl font-bold text-[#1a1a1a]">{item.name}</h3>
                                                    <span className="font-semibold text-[#8a5a54]">${item.price.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[#3a3a3a] text-sm mb-6 flex-grow">{item.description}</p>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f4dbd8] hover:bg-[#eaccc8] text-[#1a1a1a] font-semibold rounded-xl transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" /> Add to Order
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
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#f4dbd8] sticky top-36">
                                <h3 className="font-playfair text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center justify-between">
                                    Your Order
                                    <span className="bg-[#f4dbd8] text-[#1a1a1a] text-sm py-1 px-3 rounded-full">{totalItems} items</span>
                                </h3>

                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-[#8a5a54]">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Your cart is empty.</p>
                                        <p className="text-sm mt-1">Add some sweet treats!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                                            {cart.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center group bg-[#fdfbfb] p-3 rounded-xl border border-[#f4dbd8]">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-[#1a1a1a] text-sm truncate pr-2">{item.name}</p>
                                                        <p className="text-[#8a5a54] text-xs">${item.price.toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-[#eaccc8] px-2 py-1">
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

                                        <div className="border-t border-[#eaccc8] pt-4 space-y-3 mb-6">
                                            <div className="flex justify-between text-[#3a3a3a]">
                                                <span>Subtotal</span>
                                                <span>${totalPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-xl text-[#1a1a1a] pt-2">
                                                <span>Total (Est.)</span>
                                                <span>${(totalPrice * 1.08).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/checkout"
                                            className="w-full py-4 bg-[#1a1a1a] hover:bg-[#3a3a3a] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
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
