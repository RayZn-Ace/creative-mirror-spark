import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import TicketWidget from "@/components/TicketWidget";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-sky)" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Desktop / Tablet landscape: two columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          <HeroSection />
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <TicketWidget />
          </motion.div>
        </div>

        {/* Mobile / Tablet portrait: stacked */}
        <div className="md:hidden space-y-6">
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
