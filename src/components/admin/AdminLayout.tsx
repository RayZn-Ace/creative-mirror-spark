import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Calendar, Ticket, FileText, LogOut, Menu, X, ChevronRight, Layers, Activity, Users, Mail, QrCode, Gift,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Event-Serien", href: "/admin/series", icon: Layers },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Ticket-Kategorien", href: "/admin/tickets", icon: Ticket },
  { label: "Seiten-Inhalte", href: "/admin/pages", icon: FileText },
  { label: "Kunden", href: "/admin/customers", icon: Users },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Tracking & Pixel", href: "/admin/tracking", icon: Activity },
  { label: "Scanner", href: "/admin/scanner", icon: QrCode },
  { label: "Freitickets", href: "/admin/freitickets", icon: Gift },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: "hsl(0 0% 100%)" }}>Zugriff verweigert</h1>
          <p className="text-sm mb-4" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Du hast keine Admin-Berechtigung.</p>
          <button
            onClick={signOut}
            className="text-sm underline"
            style={{ color: "hsl(330 80% 55%)" }}
          >
            Ausloggen
          </button>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`${mobile ? "w-full" : "w-60 min-h-screen hidden lg:flex"} flex flex-col`}
      style={{
        background: "hsl(220 50% 6%)",
        borderRight: mobile ? "none" : "1px solid hsl(0 0% 100% / 0.06)",
      }}
    >
      <div className="p-5 flex items-center justify-between">
        <Link to="/admin" onClick={() => setSidebarOpen(false)}>
          <span
            className="text-sm font-black uppercase tracking-wider"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(330 80% 55%)" }}
          >
            Admin
          </span>
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "hsl(330 80% 55% / 0.15)" : "transparent",
                color: active ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.6)",
              }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all hover:bg-white/5"
          style={{ color: "hsl(0 0% 100% / 0.4)" }}
        >
          <LogOut className="w-4 h-4" />
          Ausloggen
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220 50% 8%)" }}>
      <Sidebar />

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-64"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 flex items-center gap-3 px-4 sm:px-6 lg:px-8"
          style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <button
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            {user.email}
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
