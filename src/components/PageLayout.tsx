import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

/* ─── Reusable dark page layout ─── */
export const PageLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 sm:pt-32 pb-24 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase mb-3 text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base font-semibold uppercase tracking-wider mb-10 text-primary">
              {subtitle}
            </p>
          )}
          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
    <BottomNav />
  </div>
);
