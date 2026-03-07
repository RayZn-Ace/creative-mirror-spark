import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

/* ─── Reusable light page layout ─── */
export const PageLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(220 20% 15%)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base font-semibold uppercase tracking-wider mb-10" style={{ color: "hsl(220 60% 50%)" }}>
              {subtitle}
            </p>
          )}
          <div className="space-y-6 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(220 10% 35%)" }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </div>
);
