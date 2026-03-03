import { PageLayout } from "@/components/PageLayout";
import { Calendar } from "lucide-react";

const VergangeneEvents = () => (
  <PageLayout title="Vergangene Events" subtitle="Was bisher geschah">
    <div className="space-y-6">
      <p>Hier findest du bald eine Übersicht aller vergangenen Events mit Fotos und Highlights.</p>

      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl"
        style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <Calendar className="w-10 h-10 mb-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          Archiv kommt bald
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
          Wir arbeiten daran, alle vergangenen Events hier aufzulisten.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default VergangeneEvents;
