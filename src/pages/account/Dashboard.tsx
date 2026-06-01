import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Ticket, Heart, ShoppingBag, Calendar } from "lucide-react";
import LoyaltyWidget from "@/components/account/LoyaltyWidget";
import ReferralWidget from "@/components/account/ReferralWidget";
import BirthdayBonusClaimer from "@/components/account/BirthdayBonusClaimer";
import ReferralClaimer from "@/components/account/ReferralClaimer";

export default function AccountDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tickets: 0, favs: 0, orders: 0, nextEvent: null as any });

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const [orders, favs] = await Promise.all([
        supabase.from("orders").select("id, total_amount, event_id, items, created_at, events!inner(title,date,city,image_url)").eq("email", user.email).eq("status", "paid").order("created_at", { ascending: false }),
        supabase.from("customer_favorites").select("event_id", { count: "exact" }).eq("user_id", user.id),
      ]);
      const ticketCount = (orders.data || []).reduce((sum, o: any) => sum + ((o.items || []).reduce((s: number, i: any) => s + (i.qty || i.quantity || 0), 0)), 0);
      const upcoming = (orders.data || []).find((o: any) => o.events?.date && new Date(o.events.date) > new Date());
      setStats({
        tickets: ticketCount,
        favs: favs.count || 0,
        orders: orders.data?.length || 0,
        nextEvent: upcoming?.events || null,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Servus, {user?.user_metadata?.display_name || user?.email?.split("@")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Hier dein Account-Overview</p>
      </div>

      <LoyaltyWidget />

      <ReferralWidget />

      <BirthdayBonusClaimer />
      <ReferralClaimer />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Ticket} label="Tickets" value={stats.tickets} to="/account/tickets" />
        <StatCard icon={Heart} label="Favoriten" value={stats.favs} to="/account/favorites" />
        <StatCard icon={ShoppingBag} label="Bestellungen" value={stats.orders} to="/account/orders" />
      </div>

      {stats.nextEvent && (
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[200px_1fr]">
            <div className="aspect-video md:aspect-square bg-muted">
              {stats.nextEvent.image_url && <img src={stats.nextEvent.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                <Calendar className="h-4 w-4" /> Dein nächstes Event
              </div>
              <h2 className="text-2xl font-bold">{stats.nextEvent.title}</h2>
              <p className="text-muted-foreground mt-1">{stats.nextEvent.city} · {new Date(stats.nextEvent.date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p>
              <Link to="/account/tickets" className="inline-block mt-4 text-primary font-semibold">Tickets ansehen →</Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to}>
      <Card className="p-6 hover:border-primary transition-colors">
        <Icon className="h-6 w-6 text-primary mb-3" />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </Card>
    </Link>
  );
}
