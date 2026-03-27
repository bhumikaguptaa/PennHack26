"use client";

import { useState,useEffect } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Bitcoin } from "lucide-react";
import { useRouter } from "next/navigation";



export default function CheckoutPage() {
    const terminal_id = "term_01"; // Default terminal ID for demonstration

    const { cart, totalPrice, clearCart } = useCart();
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        paymentOption: "crypto", // default to crypto for testing
    });
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePaymentSelect = (option: string) => {
        setFormData((prev) => ({ ...prev, paymentOption: option }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.paymentOption === "crypto") {
            const finalTotal = (totalPrice * 1.08).toFixed(2);
            const terminal_id = "term_01"; // Default terminal ID for demonstration

            try {
                const response = await fetch("http://localhost:3001/api/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount_usd: parseFloat(finalTotal),
                        terminal_id: terminal_id
                    }),
                });

                if (!response.ok) {
                    console.error("Failed to initiate crypto payment. Status:", response.status);
                }
            } catch (error) {
                console.error("Error calling checkout API:", error);
            }
            router.push(`/checkout/processing?amount=${finalTotal}&name=${encodeURIComponent(formData.name)}&contact=${encodeURIComponent(formData.contact)}&terminal_id=${terminal_id}`);
            
        } else {
            // In a real app, process payment here.
            
            clearCart();
        }
    };

   
    

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#fdfbfb] flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-[#f4dbd8]">
                    <div className="flex justify-center mb-6">
                        <CheckCircle className="w-20 h-20 text-[#8a5a54]" />
                    </div>
                    <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-4">Order Confirmed!</h2>
                    <p className="text-[#3a3a3a] mb-8">
                        Thank you for your order, {formData.name}. We've sent a confirmation to {formData.contact}.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-[#f4dbd8] text-[#1a1a1a] font-semibold rounded-xl hover:bg-[#eaccc8] transition-colors shadow-md hover:shadow-lg"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbfb] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/menu" className="inline-flex items-center text-[#8a5a54] hover:text-[#1a1a1a] font-medium mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
                </Link>

                <div className="text-center mb-12">
                    <h1 className="font-playfair text-4xl font-bold text-[#1a1a1a] tracking-tight">Checkout</h1>
                    <div className="w-16 h-1 bg-[#8a5a54] mx-auto rounded-full mt-4"></div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Order Summary */}
                    <div className="lg:w-1/3 order-2 lg:order-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f4dbd8] sticky top-28">
                            <h2 className="font-playfair text-2xl font-bold text-[#1a1a1a] mb-6 border-b border-[#f4dbd8] pb-4">Order Summary</h2>

                            {cart.length === 0 ? (
                                <p className="text-gray-500 italic mb-6">Your cart is empty.</p>
                            ) : (
                                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center group">
                                            <div className="flex-1 pr-4">
                                                <p className="font-medium text-[#1a1a1a] line-clamp-1">{item.name}</p>
                                                <p className="text-sm text-[#8a5a54]">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-[#1a1a1a]">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-[#f4dbd8] pt-4 space-y-2">
                                <div className="flex justify-between text-[#3a3a3a]">
                                    <span>Subtotal</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[#3a3a3a]">
                                    <span>Taxes (8%)</span>
                                    <span>${(totalPrice * 0.08).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-[#1a1a1a] pt-4 mt-2 border-t border-[#f4dbd8]">
                                    <span>Total</span>
                                    <span>${(totalPrice * 1.08).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="lg:w-2/3 order-1 lg:order-2">
                        <div className="bg-white p-8 rounded-2xl shadow-md border border-[#f4dbd8]">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Contact Info */}
                                <section>
                                    <h3 className="font-playfair text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                        <span className="bg-[#f4dbd8] text-[#1a1a1a] w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                                        <div>
                                            <label className="block text-sm font-medium text-[#3a3a3a] mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f4dbd8] focus:border-[#eaccc8] outline-none transition-all placeholder-gray-400"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#3a3a3a] mb-2">Email / Phone</label>
                                            <input
                                                type="text"
                                                name="contact"
                                                required
                                                value={formData.contact}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f4dbd8] focus:border-[#eaccc8] outline-none transition-all placeholder-gray-400"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Payment Options */}
                                <section>
                                    <h3 className="font-playfair text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                        <span className="bg-[#f4dbd8] text-[#1a1a1a] w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                        Payment Method
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-10">

                                        {/* Credit Card */}
                                        <div
                                            onClick={() => handlePaymentSelect('credit')}
                                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all ${formData.paymentOption === 'credit' ? 'border-[#8a5a54] bg-[#f4dbd8]/20 shadow-sm transform scale-[1.02]' : 'border-gray-100 hover:border-[#f4dbd8]'}`}
                                        >
                                            <CreditCard className={`w-8 h-8 ${formData.paymentOption === 'credit' ? 'text-[#8a5a54]' : 'text-gray-400'}`} />
                                            <span className={`font-semibold ${formData.paymentOption === 'credit' ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Credit / Debit</span>
                                        </div>

                                        {/* Cash */}
                                        <div
                                            onClick={() => handlePaymentSelect('cash')}
                                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all ${formData.paymentOption === 'cash' ? 'border-[#8a5a54] bg-[#f4dbd8]/20 shadow-sm transform scale-[1.02]' : 'border-gray-100 hover:border-[#f4dbd8]'}`}
                                        >
                                            <Banknote className={`w-8 h-8 ${formData.paymentOption === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                                            <span className={`font-semibold ${formData.paymentOption === 'cash' ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Cash on Pickup</span>
                                        </div>

                                        {/* Crypto */}
                                        <div
                                            onClick={() => handlePaymentSelect('crypto')}
                                            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all ${formData.paymentOption === 'crypto' ? 'border-[#8a5a54] bg-[#f4dbd8]/20 shadow-sm transform scale-[1.02]' : 'border-gray-100 hover:border-[#f4dbd8]'}`}
                                        >
                                            <Bitcoin className={`w-8 h-8 ${formData.paymentOption === 'crypto' ? 'text-[#8a5a54]' : 'text-gray-400'}`} />
                                            <span className={`font-semibold ${formData.paymentOption === 'crypto' ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Crypto Pay</span>
                                        </div>

                                    </div>
                                </section>

                                <div className="pt-6 border-t border-[#f4dbd8] pl-10">
                                    <button
                                        type="submit"
                                        disabled={cart.length === 0}
                                        className="w-full py-4 bg-[#b58c85] hover:bg-[#8a5a54] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                    >
                                        Place Order • ${(totalPrice * 1.08).toFixed(2)}
                                    </button>
                                    {cart.length === 0 && (
                                        <p className="text-red-500 text-sm text-center mt-3">Add items to your cart to proceed with checkout.</p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
