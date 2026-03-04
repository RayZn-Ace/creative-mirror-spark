import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CityHeatmap } from "@/components/admin/CityHeatmap";

interface CityDataItem {
  name: string;
  revenue: number;
  orders: number;
  tickets: number;
}

const GeoHeatmapWidget = () => {
  const [cityData, setCityData] = useState<CityDataItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, event_id, items")
        .eq("status", "paid");

      const { data: events } = await supabase
        .from("events")
        .select("id, city");

      const { data: tickets } = await supabase
        .from("tickets")
        .select("event_id");

      if (!orders || !events) return;

      const eventCityMap = new Map<string, string>();
      events.forEach(e => { if (e.city) eventCityMap.set(e.id, e.city); });

      const cityMap = new Map<string, CityDataItem>();
      orders.forEach(o => {
        const city = o.event_id ? eventCityMap.get(o.event_id) : null;
        if (!city) return;
        const existing = cityMap.get(city) || { name: city, revenue: 0, orders: 0, tickets: 0 };
        existing.revenue += o.total_amount || 0;
        existing.orders += 1;
        cityMap.set(city, existing);
      });

      if (tickets) {
        tickets.forEach(t => {
          const city = eventCityMap.get(t.event_id);
          if (!city) return;
          const existing = cityMap.get(city);
          if (existing) existing.tickets += 1;
        });
      }

      setCityData(
        Array.from(cityMap.values()).sort((a, b) => b.revenue - a.revenue)
      );
    };
    load();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
        Geo-Heatmap
      </h3>
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
        <CityHeatmap data={cityData} height="100%" />
      </div>
    </div>
  );
};

export default GeoHeatmapWidget;
