import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Link2 } from "lucide-react";

interface ScannerLink {
  id: string;
  label: string | null;
  active: boolean;
  event_title: string | null;
  created_at: string;
}

const ScannerActivityWidget = () => {
  const [links, setLinks] = useState<ScannerLink[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sl } = await supabase
        .from("scanner_links")
        .select("id, label, active, event_id, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!sl?.length) return;

      const eventIds = sl.map(s => s.event_id).filter(Boolean) as string[];
      const { data: events } = eventIds.length
        ? await supabase.from("events").select("id, title").in("id", eventIds)
        : { data: [] };

      setLinks(sl.map(s => ({
        id: s.id,
        label: s.label,
        active: s.active,
        event_title: events?.find(e => e.id === s.event_id)?.title ?? null,
        created_at: s.created_at,
      })));
    })();
  }, []);

  if (!links.length) return (
    <div className="text-center py-6">
      <QrCode className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Scanner-Links</p>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {links.map(l => (
        <div key={l.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.active ? "hsl(140 60% 50%)" : "hsl(0 60% 50%)" }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
              {l.label || "Scanner-Link"}
            </p>
            {l.event_title && (
              <p className="text-[10px] truncate" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{l.event_title}</p>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: l.active ? "hsl(140 60% 50%)" : "hsl(0 60% 50%)" }}>
            {l.active ? "Aktiv" : "Inaktiv"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ScannerActivityWidget;
