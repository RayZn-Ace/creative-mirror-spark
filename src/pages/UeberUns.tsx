import { PageLayout } from "@/components/PageLayout";
import { Users, Zap, Heart, Music } from "lucide-react";

const stats = [
  { icon: Calendar, label: "Events", value: "50+" },
  { icon: Users, label: "Gäste", value: "25.000+" },
  { icon: Music, label: "DJs & Acts", value: "100+" },
  { icon: Heart, label: "Unvergessliche Nächte", value: "∞" },
];

import { Calendar } from "lucide-react";

const UeberUns = () => (
  <PageLayout title="Über uns" subtitle="Wer steckt hinter Nachtaktiv Events?">
    <div className="space-y-8">
      <p className="text-base sm:text-lg" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
        <strong style={{ color: "hsl(0 0% 100%)" }}>Nachtaktiv Events</strong> steht für unvergessliche Partynächte in NRW. Seit unserer Gründung haben wir es uns zur Mission gemacht, Events zu veranstalten, über die man noch Jahre später spricht.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl text-center"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "hsl(0 70% 55%)" }} />
            <div className="text-xl sm:text-2xl font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
              {stat.value}
            </div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-3" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Unsere Mission
        </h2>
        <p>
          Wir glauben daran, dass jede Party eine Geschichte erzählen sollte. Von der ersten Sekunde, in der du durch die Tür gehst, bis zum letzten Beat – bei uns erlebst du mehr als nur eine Nacht. Konfetti-Explosionen, Flammenwerfer, CO2-Effekte und die beste Musik – das ist NACHTAKTIV.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-3" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Unsere Locations
        </h2>
        <p>
          Wir veranstalten Events in den besten Clubs und Locations in NRW – von Paderborn über Bielefeld bis Dortmund. Jede Location wird sorgfältig ausgewählt, damit du das bestmögliche Erlebnis hast.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-3" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Das Team
        </h2>
        <p>
          Hinter Nachtaktiv Events steht ein junges, leidenschaftliches Team, das selbst für Partys lebt. Wir sind Eventmanager, DJs, Designer und Marketing-Profis – vereint durch die Liebe zur Nacht.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default UeberUns;
