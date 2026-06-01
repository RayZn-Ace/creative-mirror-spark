import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, User, Ticket, ShoppingBag, Heart, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { cn } from "@/lib/utils";

const items = [
  { to: "/account", icon: LayoutDashboard, label: "Übersicht", end: true },
  { to: "/account/profile", icon: User, label: "Profil" },
  { to: "/account/tickets", icon: Ticket, label: "Meine Tickets" },
  { to: "/account/orders", icon: ShoppingBag, label: "Bestellungen" },
  { to: "/account/favorites", icon: Heart, label: "Favoriten" },
  { to: "/account/notifications", icon: Bell, label: "Benachrichtigungen" },
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
        <aside className="lg:sticky lg:top-24 lg:self-start">
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
