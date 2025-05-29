
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SkinShowcase from '@/components/SkinShowcase';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-game-dark">
      <Header />
      <main>
        <HeroSection />
        <SkinShowcase />
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
