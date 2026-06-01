import { Link } from "react-router-dom";
import { useUserStats } from "@/hooks/useUserStats";
import { Card } from "@/components/ui/card";
import { Sparkles, MapPin, Clock, ArrowRight } from "lucide-react";

export default function StatsHighlightWidget() {
  const stats = useUserStats();

  if (stats.loading || stats.partiesAttended === 0) return null;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/30">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
              <Sparkles className="h-4 w-4" /> Deine Story
            </div>
            <h3 className="text-xl font-bold">
              {stats.partiesAttended} Partys · {stats.hoursDanced}h Vibes
            </h3>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              {stats.topCity && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Top: {stats.topCity}
                </span>
              )}
              {stats.firstPartyDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Seit{" "}
                  {new Date(stats.firstPartyDate).getFullYear()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link
            to="/account/wrapped"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <Sparkles className="h-4 w-4" /> Year in Review
          </Link>
          <Link
            to="/account/memories"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-card border rounded-lg px-4 py-2.5 text-sm font-semibold hover:border-primary transition"
          >
            Memory Lane <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
