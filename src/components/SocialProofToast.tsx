import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

// 80% female, 20% male — age-appropriate names (16-20)
const FEMALE_NAMES = [
  "Sophie", "Lena", "Emma", "Mia", "Hannah", "Laura", "Lea", "Marie",
  "Lisa", "Julia", "Lara", "Nina", "Jana", "Alina", "Amelie", "Clara",
  "Emilia", "Charlotte", "Nele", "Paulina", "Chiara", "Luisa", "Zoe",
  "Leonie", "Ella", "Mila", "Ida", "Lina", "Maja", "Frieda", "Lia",
  "Stella", "Jule", "Finja", "Romy", "Greta", "Tessa", "Pia", "Leni",
];

const MALE_NAMES = [
  "Leon", "Finn", "Paul", "Noah", "Luis", "Ben", "Elias", "Jonas",
  "Luca", "Felix", "Niklas", "Moritz", "Tim", "Jan", "Max", "Tom",
];

const randFrom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randCount = () => (Math.random() < 0.5 ? 2 : Math.random() < 0.7 ? 3 : 4);

const pickName = () => (Math.random() < 0.8 ? randFrom(FEMALE_NAMES) : randFrom(MALE_NAMES));

interface ToastMsg {
  name: string;
  count: number;
  eventTitle: string;
  id: number;
  isReal: boolean;
}

interface PublishedEvent {
  id: string;
  title: string;
}

export default function SocialProofToast() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const [events, setEvents] = useState<PublishedEvent[]>([]);
  const realOrdersQueue = useRef<ToastMsg[]>([]);
  const location = useLocation();

  // Don't show on admin pages
  const isAdmin = location.pathname.startsWith("/admin");

  // Fetch published events that have ticket categories
  useEffect(() => {
    if (isAdmin) return;
    supabase
      .from("events")
      .select("id, title, ticket_categories!inner(id)")
      .eq("status", "published")
      .then(({ data }) => {
        if (data) {
          setEvents(data.map((e: any) => ({ id: e.id, title: e.title })));
        }
      });
  }, [isAdmin]);

  // Subscribe to real orders (paid)
  useEffect(() => {
    if (isAdmin) return;
    const channel = supabase
      .channel("social-proof-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as any;
          if (order.status === "paid" && order.name) {
            const items = Array.isArray(order.items) ? order.items : [];
            const count = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1;
            // Find event title
            const ev = events.find((e) => e.id === order.event_id);
            if (ev) {
              realOrdersQueue.current.push({
                name: order.name.split(" ")[0],
                count,
                eventTitle: ev.title,
                id: Date.now(),
                isReal: true,
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, events]);

  // Also fetch recent real orders on mount
  useEffect(() => {
    if (isAdmin || events.length === 0) return;
    supabase
      .from("orders")
      .select("name, items, event_id")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          data.forEach((order: any) => {
            const ev = events.find((e) => e.id === order.event_id);
            if (ev && order.name) {
              const items = Array.isArray(order.items) ? order.items : [];
              const count = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1;
              realOrdersQueue.current.push({
                name: order.name.split(" ")[0],
                count,
                eventTitle: ev.title,
                id: Date.now() + Math.random(),
                isReal: true,
              });
            }
          });
        }
      });
  }, [isAdmin, events]);

  const showToast = useCallback(() => {
    // 40% chance to show real order if available
    if (realOrdersQueue.current.length > 0 && Math.random() < 0.4) {
      const real = realOrdersQueue.current.shift()!;
      setMsg({ ...real, id: Date.now() });
    } else if (events.length > 0) {
      setMsg({
        name: pickName(),
        count: randCount(),
        eventTitle: randFrom(events).title,
        id: Date.now(),
        isReal: false,
      });
    }
    setTimeout(() => setMsg(null), 4000);
  }, [events]);

  useEffect(() => {
    if (isAdmin || events.length === 0) return;
    const first = setTimeout(showToast, 5000);
    const interval = setInterval(showToast, (15 + Math.random() * 15) * 1000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [isAdmin, events, showToast]);

  if (isAdmin) return null;

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs"
            style={{
              background: "linear-gradient(135deg, hsl(230 80% 55% / 0.15), hsl(220 50% 12% / 0.9))",
              border: "1px solid hsl(230 80% 55% / 0.3)",
            }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "hsl(230 80% 55% / 0.25)" }}
            >
              <Ticket className="w-4 h-4" style={{ color: "hsl(230 80% 55%)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "hsl(0 0% 100%)" }}>
                {msg.name} hat gerade {msg.count} Tickets gekauft
              </p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "hsl(230 80% 65%)" }}>
                🎉 {msg.eventTitle}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
