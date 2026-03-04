import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine } from "lucide-react";

interface CheckIn {
  id: string;
  holder_name: string | null;
  checked_in_at: string;
  event_title: string;
}

const RecentCheckinsWidget = () => {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  useEffect(() => {
    (async () => {
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, holder_name, checked_in_at, event_id")
        .eq("status", "checked_in")
        .not("checked_in_at", "is", null)
        .order("checked_in_at", { ascending: false })
        .limit(8);

      if (!tickets?.length) return;

      const eventIds = [...new Set(tickets.map(t => t.event_id))];
      const { data: events } = await supabase.from("events").select("id, title").in("id", eventIds);

      setCheckins(tickets.map(t => ({
        id: t.id,
        holder_name: t.holder_name,
        checked_in_at: t.checked_in_at!,
        event_title: events?.find(e => e.id === t.event_id)?.title ?? "–",
      })));
    })();
  }, []);

  if (!checkins.length) return (
    <div className="text-center py-6">
      <ScanLine className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Check-ins</p>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {checkins.map(c => (
        <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{c.holder_name || "Unbekannt"}</p>
            <p className="text-[10px] truncate" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{c.event_title}</p>
          </div>
          <span className="text-[10px] shrink-0" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            {new Date(c.checked_in_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentCheckinsWidget;
