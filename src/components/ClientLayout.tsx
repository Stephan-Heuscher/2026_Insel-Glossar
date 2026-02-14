"use client";

import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative z-10">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                {children}
            </main>
        </div>
    );
}
