import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

/* ─── Reusable dark page layout ─── */
export const PageLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="min-h-screen" style={{ background: "hsl(220 50% 8%)" }}>
    <Navbar />
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base font-semibold uppercase tracking-wider mb-10" style={{ color: "hsl(330 80% 55%)" }}>
              {subtitle}
            </p>
          )}
          <div className="prose-dark space-y-6 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
    {/* Footer */}
    <footer className="pb-8 pt-8 border-t" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>© 2025 Gimme Gimme Party</span>
        <div className="flex gap-4">
          <Link to="/impressum" className="text-xs hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Impressum</Link>
          <Link to="/datenschutz" className="text-xs hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Datenschutz</Link>
          <Link to="/agb" className="text-xs hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.3)" }}>AGB</Link>
        </div>
      </div>
    </footer>
  </div>
);
