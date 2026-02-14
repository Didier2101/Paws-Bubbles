import Header from "@/components/Header";
import LandingPage from "@/components/LandingPage";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Paws & Bubbles | Inicio',
  description: 'El mejor cuidado para tu mascota con un toque de lujo y profesionalismo.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <LandingPage />
      <Footer />
    </main>
  );
}
