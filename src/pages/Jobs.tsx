import { PageLayout } from "@/components/PageLayout";
import { MessageCircle, Briefcase } from "lucide-react";

const positions = [
  {
    title: "Eventmanager (m/w/d)",
    type: "Teilzeit / Minijob",
    desc: "Du planst und koordinierst unsere Events vor Ort. Erfahrung im Eventbereich ist ein Plus.",
  },
  {
    title: "Social Media Manager (m/w/d)",
    type: "Freelance / Remote",
    desc: "Du erstellst Content für Instagram, TikTok & Co. und baust unsere Community weiter aus.",
  },
  {
    title: "Türsteher / Security (m/w/d)",
    type: "Auf Eventbasis",
    desc: "Du sorgst für Sicherheit und ein gutes Miteinander auf unseren Events. § 34a erforderlich.",
  },
  {
    title: "Fotograf / Videograf (m/w/d)",
    type: "Auf Eventbasis",
    desc: "Du hältst unsere Events in Bildern und Videos fest – für Social Media und unsere Website.",
  },
];

const Jobs = () => (
  <PageLayout title="Jobs" subtitle="Werde Teil des Teams">
    <div className="space-y-8">
      <p className="text-base sm:text-lg" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
        Du willst Teil von <strong style={{ color: "hsl(0 0% 100%)" }}>Nachtaktiv Events</strong> werden? Wir suchen immer motivierte Leute, die Bock auf Partys und Events haben!
      </p>

      <div className="space-y-3">
        {positions.map((pos) => (
          <div
            key={pos.title}
            className="p-5 rounded-2xl"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>{pos.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 70% 55%)" }}>{pos.type}</span>
                <p className="text-xs sm:text-sm mt-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{pos.desc}</p>
              </div>
              <Briefcase className="w-5 h-5 shrink-0 mt-1" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
            </div>
          </div>
        ))}
      </div>

      <div
        className="p-6 rounded-2xl text-center"
        style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <p className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Interesse? Schreib uns mit einem kurzen Text über dich!
        </p>
        <a
          href="https://wa.me/49123456789?text=Hi%2C%20ich%20interessiere%20mich%20f%C3%BCr%20einen%20Job%20bei%20euch!"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
          style={{ background: "hsl(0 70% 50%)", color: "white", boxShadow: "0 4px 20px hsl(0 70% 50% / 0.4)" }}
        >
          <MessageCircle className="w-4 h-4" /> Jetzt bewerben
        </a>
      </div>
    </div>
  </PageLayout>
);

export default Jobs;
