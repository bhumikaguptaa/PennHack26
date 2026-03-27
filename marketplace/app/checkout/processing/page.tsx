"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { CheckCircle, Loader2, SmartphoneNfc } from "lucide-react";
import Link from "next/link";
import { io } from "socket.io-client";

function ProcessingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart, cart } = useCart();

    const [status, setStatus] = useState<"processing" | "completed">("processing");

    const amount = searchParams.get("amount") || "0.00";
    const name = searchParams.get("name") || "Customer";
    const contact = searchParams.get("contact") || "";
    // Dynamically grab the hostname from the browser so it works on localhost as well as network IP tests
    const SOCKET_URL = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://localhost:3001";
    const terminal_id = "term_01"; // Default terminal ID for demonstration
    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SOCKET_URL);
        newSocket.on('connect', () => {
            newSocket.emit('join_terminal', terminal_id);
        });

        newSocket.on('payment_success', async (data) => {
            //0x7345eb99d8429ebce1d9ff64c38cb84832c8bbeaee5da5e0594e620b9e2bd447
            console.log('Payment successful:', data);
            await completeTransaction();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [terminal_id]);

    async function completeTransaction() {
        setStatus("completed");
        // const response = await fetch("/api/upload", {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         name: name,
        //         contact: contact,
        //         items: cart,
        //         amount: amount
        //     })
        // })

        // if (!response.ok) {
        //     alert("ERROR WITH PINATA")
        //     const data = await response.json()

        //     console.log(data)
        // }

    }

    if (status === "completed") {
        return (
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-[#d1fae5] mx-4 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                        <CheckCircle className="w-24 h-24 text-emerald-500 relative z-10" />
                    </div>
                </div>
                <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Payment Successful!</h2>
                <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full mt-4 mb-6"></div>

                <p className="text-[#3a3a3a] mb-2 text-lg">
                    Thank you {name}, your transaction of <span className="font-bold text-[#1a1a1a]">${amount}</span> is complete.
                </p>
                {contact && (
                    <p className="text-gray-500 mb-8 text-sm">
                        Receipt sent to {contact}
                    </p>
                )}

                <Link
                    href="/"
                    className="inline-block px-10 py-4 bg-[#059669] text-white font-semibold rounded-xl hover:bg-[#047857] transition-colors shadow-lg hover:shadow-xl w-full text-lg"
                >
                    Return to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-[#d1fae5] mx-4 flex flex-col items-center">

            <div className="relative mb-10 mt-4">
                <div className="absolute inset-0 bg-[#d1fae5] rounded-full animate-pulse opacity-50 scale-150"></div>
                <div className="w-32 h-32 bg-[#059669] rounded-full flex items-center justify-center relative z-10 shadow-xl overflow-hidden ring-8 ring-[#ecfdf5]">
                    <SmartphoneNfc className="w-16 h-16 text-white animate-bounce" />
                </div>
            </div>

            <h2 className="font-playfair text-3xl font-bold text-[#1a1a1a] mb-4">Processing Payment</h2>

            <div className="flex items-center justify-center gap-3 text-xl text-[#059669] font-medium mb-8 bg-[#ecfdf5] py-3 px-6 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Please look at the POS</span>
            </div>

            <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">Amount Due</span>
                    <span className="text-2xl font-bold text-[#1a1a1a]">${amount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="text-[#10b981] font-semibold animate-pulse">Waiting for network...</span>
                </div>
            </div>

        </div>
    );
}

export default function ProcessingPage() {
    return (
        <div className="min-h-screen bg-[#fdfbfb] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#d1fae5] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#a7f3d0] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <Suspense fallback={<div className="text-xl text-[#059669] font-medium animate-pulse">Loading...</div>}>
                <ProcessingContent />
            </Suspense>
        </div>
    );
}
