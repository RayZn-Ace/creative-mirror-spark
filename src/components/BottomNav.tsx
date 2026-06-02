import { Link, useLocation } from "react-router-dom";
import { Calendar, Ticket, Image, User } from "lucide-react";
import { getGlobalTranslations } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

type Tab =
  | { type: "link"; icon: typeof Calendar; label: string; path: string; center?: boolean }
  | { type: "action"; emoji: string; label: string; onClick: () => void };

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const gt = getGlobalTranslations();

  if (location.pathname.startsWith("/admin")) return null;

  const tabs: Tab[] = [
    { type: "link", icon: Calendar, label: "Events", path: "/" },
    { type: "link", icon: Image, label: gt.navMedia || "Partymomente", path: "/fotos" },
    { type: "link", icon: Ticket, label: gt.navTickets || "Tickets", path: "/termine", center: true },
    {
      type: "action",
      emoji: "👩‍💼",
      label: "Sophia",
      onClick: () => window.dispatchEvent(new CustomEvent("open-sophia")),
    },
    { type: "link", icon: User, label: user ? "Konto" : "Login", path: user ? "/account" : "/login" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab, i) => {
          if (tab.type === "link" && tab.center) {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg glow-primary">
                  <tab.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${isActive ? "text-primary" : "text-primary"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          if (tab.type === "action") {
            return (
              <button
                key={`action-${i}`}
                type="button"
                onClick={tab.onClick}
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label={tab.label}
              >
                <span className="text-lg leading-none" role="img" aria-hidden>
                  {tab.emoji}
                </span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          const isActive =
            location.pathname === tab.path ||
            (tab.path === "/" && location.pathname === "/");

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
