"use client";

import Header from "@/components/Header";
import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";

export default function ReservaPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="pt-20">
                <BookingSection />
            </div>
            <Footer />
        </main>
    );
}
