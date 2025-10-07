import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import TaglineSection from "@/components/TaglineSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
        <TaglineSection />
      </main>
      <Footer />
    </div>
  );
}
