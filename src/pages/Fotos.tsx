import { PageLayout } from "@/components/PageLayout";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";

const Fotos = () => (
  <PageLayout title="Fotos" subtitle="Galerien vergangener Events">
    <div className="space-y-8">
      <p>
        Hier findest du bald Fotos und Galerien von unseren vergangenen Events. Folge uns auf Instagram für aktuelle Bilder und Stories!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {["PROJECT PADERBORN", "CITY MADNESS", "NEON NIGHTS"].map((event) => (
          <motion.div
            key={event}
            className="aspect-[16/10] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            whileHover={{ borderColor: "hsl(0 70% 50% / 0.3)" }}
          >
            <Camera className="w-8 h-8" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
            <span className="text-sm font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.2)", fontFamily: "'Orbitron', sans-serif" }}>
              {event}
            </span>
            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Demnächst verfügbar</span>
          </motion.div>
        ))}
      </div>
    </div>
  </PageLayout>
);

export default Fotos;
