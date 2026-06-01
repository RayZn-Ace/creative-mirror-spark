import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import FavoriteButton from "@/components/FavoriteButton";
import { Heart, Calendar, MapPin } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: favs } = await supabase
        .from("customer_favorites")
        .select("event_id")
        .eq("user_id", user.id);
      const ids = (favs || []).map((f) => f.event_id);
      if (!ids.length) { setLoading(false); return; }
      const { data: evs } = await supabase
        .from("events")
        .select("id, title, slug, date, city, image_url, location_name")
        .in("id", ids)
        .order("date", { ascending: true });
      setEvents(evs || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div>Lade...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Favoriten</h1>
      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Du hast noch keine Events gespeichert.</p>
          <Link to="/" className="text-primary font-semibold mt-2 inline-block">Events entdecken →</Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <Card key={ev.id} className="overflow-hidden relative group">
              <FavoriteButton eventId={ev.id} className="absolute top-3 right-3 z-10" />
              <Link to={`/${ev.slug}`}>
                <div className="aspect-video bg-muted">
                  {ev.image_url && <img src={ev.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                </div>
                <div className="p-4">
                  <h3 className="font-bold line-clamp-1">{ev.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    {ev.date && new Date(ev.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                    <MapPin className="h-3 w-3 ml-1" />
                    {ev.city}
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
