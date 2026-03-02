import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import TicketWidget from "@/components/TicketWidget";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-sky)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Desktop: two columns */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
          <HeroSection />
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <TicketWidget />
          </motion.div>
        </div>

        {/* Mobile: stacked */}
        <div className="lg:hidden space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HeroSection />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TicketWidget />
          </motion.div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
