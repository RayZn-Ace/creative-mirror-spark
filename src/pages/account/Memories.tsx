import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUserStats } from "@/hooks/useUserStats";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Ticket, Clock, Heart, Trophy } from "lucide-react";

export default function Memories() {
  const stats = useUserStats();

  const grouped = useMemo(() => {
    const map: Record<string, typeof stats.pastEvents> = {};
    stats.pastEvents
      .filter((e) => e.date)
      .sort((a, b) => (a.date! < b.date! ? 1 : -1))
      .forEach((e) => {
        const y = String(new Date(e.date!).getFullYear());
        (map[y] = map[y] || []).push(e);
      });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [stats.pastEvents]);

  if (stats.loading) {
    return <div className="p-12 text-center text-muted-foreground">Lade deine Memories...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary" /> Memory Lane
        </h1>
        <p className="text-muted-foreground mt-1">Deine Nightlife-Journey – jede Nacht ein Vibe ✨</p>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={Ticket} label="Partys" value={stats.partiesAttended} />
        <MiniStat icon={Clock} label="Stunden gefeiert" value={stats.hoursDanced} />
        <MiniStat icon={MapPin} label="Top-City" value={stats.topCity || "—"} small />
        <MiniStat
          icon={Trophy}
          label="Dabei seit"
          value={stats.firstPartyDate ? new Date(stats.firstPartyDate).getFullYear() : "—"}
        />
      </div>

      {grouped.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Noch keine Memories</h2>
          <p className="text-muted-foreground">
            Schnapp dir dein erstes Ticket und starte deine Nightlife-Story 🚀
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([year, events]) => (
            <section key={year}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl font-black text-primary">{year}</div>
                <div className="text-sm text-muted-foreground">
                  {events.length} {events.length === 1 ? "Nacht" : "Nächte"}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="relative pl-6 border-l-2 border-primary/30 space-y-4">
                {events.map((e) => (
                  <div key={e.order_id} className="relative">
                    <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    <Card className="overflow-hidden hover:border-primary transition-colors">
                      <div className="grid sm:grid-cols-[160px_1fr]">
                        <div className="aspect-video sm:aspect-square bg-muted">
                          {e.image_url && (
                            <img
                              src={e.image_url}
                              alt={e.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-xs text-primary font-semibold uppercase tracking-wider">
                            {new Date(e.date!).toLocaleDateString("de-DE", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                          <h3 className="text-lg font-bold mt-1">{e.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {e.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {e.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Ticket className="h-3.5 w-3.5" /> {e.ticket_count}{" "}
                              {e.ticket_count === 1 ? "Ticket" : "Tickets"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, small }: any) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-primary mb-2" />
      <div className={small ? "text-lg font-bold truncate" : "text-2xl font-bold"}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
