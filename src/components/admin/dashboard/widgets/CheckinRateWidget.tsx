import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck } from "lucide-react";

const CheckinRateWidget = () => {
  const [data, setData] = useState({ total: 0, checkedIn: 0, rate: 0 });

  useEffect(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    
    supabase
      .from("tickets")
      .select("id, status, event_id")
      .then(async ({ data: tickets }) => {
        if (!tickets) return;
        // Get events from last 30 days
        const { data: events } = await supabase
          .from("events")
          .select("id, date")
          .gte("date", thirtyDaysAgo);
        
        const eventIds = new Set(events?.map(e => e.id) ?? []);
        const relevant = tickets.filter(t => eventIds.has(t.event_id));
        const checkedIn = relevant.filter(t => t.status === "checked_in").length;
        const total = relevant.length;
        setData({ total, checkedIn, rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0 });
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <UserCheck className="w-6 h-6" style={{ color: "hsl(140 60% 50%)" }} />
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(140 60% 50%)" strokeWidth="3"
            strokeDasharray={`${data.rate} ${100 - data.rate}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color: "hsl(0 0% 100%)" }}>
          {data.rate}%
        </span>
      </div>
      <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{data.checkedIn} / {data.total} Tickets (30d)</p>
    </div>
  );
};

export default CheckinRateWidget;
