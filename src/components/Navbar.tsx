import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Ticket, Camera, Users, MessageCircle, Instagram,
  ChevronDown, Menu, X, Mail, HelpCircle, FileText, Shield, Scale,
  Megaphone, MapPin, Phone
} from "lucide-react";

/* ─── Menu Structure ─── */
interface MenuItem {
  label: string;
  href?: string;
  icon?: any;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Events",
    icon: Calendar,
    children: [
      { label: "Alle Events", href: "/", icon: Calendar },
      { label: "Fotos & Galerien", href: "/fotos", icon: Camera },
      { label: "Vergangene Events", href: "/vergangene-events", icon: Calendar },
    ],
  },
  {
    label: "Tickets",
    icon: Ticket,
    children: [
      { label: "Tickets kaufen", href: "/", icon: Ticket },
      { label: "Meine Tickets", href: "/meine-tickets", icon: Ticket },
      { label: "Muttizettel", href: "/muttizettel", icon: FileText },
    ],
  },
  {
    label: "Über uns",
    icon: Users,
    children: [
      { label: "Wer wir sind", href: "/ueber-uns", icon: Users },
      { label: "FAQ", href: "/faq", icon: HelpCircle },
      { label: "Kontakt", href: "/kontakt", icon: Mail },
    ],
  },
  {
    label: "Zusammenarbeiten",
    icon: Megaphone,
    children: [
      { label: "Promoter werden", href: "/promoter", icon: Megaphone },
      { label: "Abiklasse anfragen", href: "/abiklasse", icon: Users },
      { label: "Jobs", href: "/jobs", icon: FileText },
    ],
  },
];

/* ─── Desktop Dropdown ─── */
const DesktopDropdown = ({ item }: { item: MenuItem }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className="flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
        style={{ color: open ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.6)" }}
      >
        {item.label}
        <ChevronDown
          className="w-3 h-3 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <AnimatePresence>
        {open && item.children && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl overflow-hidden py-2"
            style={{
              background: "hsl(0 5% 10%)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
              boxShadow: "0 20px 50px hsl(0 0% 0% / 0.5)",
              backdropFilter: "blur(20px)",
            }}
          >
            {item.children.map((child) => (
              <Link
                key={child.label}
                to={child.href || "/"}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: "hsl(0 0% 100% / 0.75)" }}
                onClick={() => setOpen(false)}
              >
                {child.icon && <child.icon className="w-4 h-4" style={{ color: "hsl(0 70% 55%)" }} />}
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Mobile Menu ─── */
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] z-[100] overflow-y-auto"
            style={{ background: "hsl(0 5% 8%)", borderLeft: "1px solid hsl(0 0% 100% / 0.08)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between p-5">
              <span
                className="text-sm font-black uppercase tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
              >
                Menü
              </span>
              <button onClick={onClose} style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-3 pb-8 space-y-1">
              {menuItems.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === item.label ? null : item.label)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-colors"
                    style={{
                      color: expandedGroup === item.label ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.6)",
                      background: expandedGroup === item.label ? "hsl(0 0% 100% / 0.05)" : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon && <item.icon className="w-4 h-4" style={{ color: "hsl(0 70% 55%)" }} />}
                      {item.label}
                    </span>
                    <ChevronDown
                      className="w-4 h-4 transition-transform"
                      style={{ transform: expandedGroup === item.label ? "rotate(180deg)" : "rotate(0)" }}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedGroup === item.label && item.children && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-1 space-y-0.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              to={child.href || "/"}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5"
                              style={{ color: "hsl(0 0% 100% / 0.6)" }}
                              onClick={onClose}
                            >
                              {child.icon && <child.icon className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 55% / 0.6)" }} />}
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Social links */}
              <div className="pt-6 px-3 flex gap-3">
                <a
                  href="https://instagram.com/nachtaktiv.events"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
                <a
                  href="https://wa.me/49123456789"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" }}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Main Navbar ─── */
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 transition-all duration-300"
        style={{
          background: scrolled ? "hsl(0 5% 5% / 0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid hsl(0 0% 100% / 0.06)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="text-base sm:text-lg font-black uppercase tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
            >
              NACHTAKTIV
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "hsl(0 70% 50%)" }}>
              EVENTS
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <DesktopDropdown key={item.label} item={item} />
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://instagram.com/nachtaktiv.events"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
              style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://wa.me/49123456789"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
              style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.7)" }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;
