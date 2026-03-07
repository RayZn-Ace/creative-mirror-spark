import { Link, useLocation } from "react-router-dom";
import { Calendar, Ticket, Image, User } from "lucide-react";
import { getGlobalTranslations } from "@/lib/i18n";

export default function BottomNav() {
  const location = useLocation();
  const gt = getGlobalTranslations();

  // Hide on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  const tabs = [
    { icon: Calendar, label: "Events", path: "/" },
    { icon: Ticket, label: gt.navTickets || "Tickets", path: "/termine" },
    { icon: Image, label: gt.navMedia || "Fotos", path: "/fotos" },
    { icon: User, label: "Profil", path: "/meine-tickets" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab, i) => {
          const isCenter = i === 1; // Tickets gets the highlight
          const isActive = location.pathname === tab.path || 
            (tab.path === "/" && location.pathname === "/");

          if (isCenter) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg glow-primary">
                  <tab.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold mt-1 text-primary">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
