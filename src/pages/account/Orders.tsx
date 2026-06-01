import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, events(title, date, city, image_url)")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div>Lade...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Meine Bestellungen</h1>
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Noch keine Bestellungen.
        </Card>
      ) : (
        orders.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{o.events?.title || "Bestellung"}</h3>
                  <Badge variant={o.status === "paid" ? "default" : "secondary"}>
                    {o.status === "paid" ? "Bezahlt" : o.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  {o.events?.city && ` · ${o.events.city}`}
                </p>
                <p className="text-sm mt-2">
                  {((o.items as any[]) || []).map((i: any) => `${i.qty || i.quantity}× ${i.name || i.category_name}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Number(o.total_amount).toFixed(2)} €</div>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link to={`/bestellung/${o.id}`}>
                    <ExternalLink className="h-3 w-3 mr-1" /> Details
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
