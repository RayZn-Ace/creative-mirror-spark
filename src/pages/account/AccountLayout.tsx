import { useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { LayoutDashboard, User, Ticket, ShoppingBag, Heart, Bell, LogOut, Trophy, Users, Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { cn } from "@/lib/utils";

const allItems = [
  { to: "/account", icon: LayoutDashboard, label: "Übersicht", end: true, feature: null as null | "wrapped_enabled" },
  { to: "/account/rewards", icon: Trophy, label: "Rewards", feature: null },
  { to: "/account/wrapped", icon: Sparkles, label: "Year in Review", feature: "wrapped_enabled" as const },
  { to: "/account/memories", icon: History, label: "Memory Lane", feature: null },
  { to: "/account/friends", icon: Users, label: "Squad", feature: null },
  { to: "/account/profile", icon: User, label: "Profil", feature: null },
  { to: "/account/tickets", icon: Ticket, label: "Meine Tickets", feature: null },
  { to: "/account/orders", icon: ShoppingBag, label: "Bestellungen", feature: null },
  { to: "/account/favorites", icon: Heart, label: "Favoriten", feature: null },
  { to: "/account/notifications", icon: Bell, label: "Benachrichtigungen", feature: null },
];

export default function AccountLayout() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  if (loading || !user) {
    return <PageLayout title="Account"><div className="container py-12">Lade...</div></PageLayout>;
  }

  return (
    <PageLayout title="Account">
      <div className="container py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Mobile: horizontal scrollable pill nav */}
        <nav className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2 w-max">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_20px_hsl(var(--primary)/0.4)]"
                      : "bg-card/60 text-foreground/80 border-border hover:bg-accent"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={async () => { await signOut(); nav("/"); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border border-destructive/40 text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </nav>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-2xl border p-4 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={async () => {
                await signOut();
                nav("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-3" /> Logout
            </Button>
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </PageLayout>
  );
}
