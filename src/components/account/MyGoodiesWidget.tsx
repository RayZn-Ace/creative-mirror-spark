import { useGoodies } from "@/hooks/useGoodies";
import { Card } from "@/components/ui/card";
import { Gift, Sparkles, Calendar, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function MyGoodiesWidget() {
  const { active, loading, redeem } = useGoodies();

  if (loading || active.length === 0) return null;

  return (
    <Card className="p-5 overflow-hidden relative border-0" style={{ background: "linear-gradient(135deg, hsl(280 70% 15%), hsl(330 70% 20%))" }}>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: "hsl(320 90% 60%)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg" style={{ background: "hsl(320 90% 60% / 0.2)" }}>
            <Sparkles className="w-5 h-5" style={{ color: "hsl(320 90% 70%)" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deine Member-Goodies</h3>
            <p className="text-xs text-white/60">{active.length} aktiv · nur für dich 💜</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {active.slice(0, 4).map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl backdrop-blur"
              style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: g.color || "hsl(270 70% 55%)" }}>
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{g.title}</div>
                  {g.description && <div className="text-xs text-white/60 line-clamp-2 mt-0.5">{g.description}</div>}
                  {g.expires_at && (
                    <div className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> gültig bis {new Date(g.expires_at).toLocaleDateString("de-DE")}
                    </div>
                  )}
                  {g.code && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(g.code!); toast.success("Code kopiert"); }}
                      className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono"
                      style={{ background: "hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100%)" }}
                    >
                      <Copy className="w-3 h-3" /> {g.code}
                    </button>
                  )}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={async () => {
                        if (!confirm("Goodie jetzt einlösen? Es kann danach nicht mehr verwendet werden.")) return;
                        const ok = await redeem(g.id);
                        if (ok) toast.success("Eingelöst – viel Spaß!");
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Einlösen
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
