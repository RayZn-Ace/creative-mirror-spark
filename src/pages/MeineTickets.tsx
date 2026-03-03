import { PageLayout } from "@/components/PageLayout";
import { Ticket } from "lucide-react";

const MeineTickets = () => (
  <PageLayout title="Meine Tickets" subtitle="Deine gekauften Tickets">
    <div className="space-y-6">
      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl"
        style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <Ticket className="w-10 h-10 mb-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          Du musst dich einloggen, um deine Tickets zu sehen.
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
          Login-Funktion kommt bald!
        </p>
      </div>
    </div>
  </PageLayout>
);

export default MeineTickets;
