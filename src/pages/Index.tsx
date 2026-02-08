import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TemplatesSection } from "@/components/landing/TemplatesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { FloatingOrbs } from "@/components/landing/FloatingOrbs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <FloatingOrbs />
      <Navbar />
      <HeroSection />
      <AnimatedCounter />
      <FeaturesSection />
      <HowItWorksSection />
      <TemplatesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
