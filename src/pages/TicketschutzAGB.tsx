import { PageLayout } from "@/components/PageLayout";
import { TicketProtectionTerms } from "@/components/TicketProtectionTerms";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function TicketschutzAGB() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Ticketschutz-AGB | Nightlife Generation";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <PageLayout title="Ticketschutz-AGB" subtitle="Nightlife Generation · Optionaler Ticketschutz">
      <p>Ergänzende Bedingungen bei mitgebuchtem Ticketschutz; gesetzliche Erstattungsansprüche bleiben unberührt.</p>
      <TicketProtectionTerms />
      <Button asChild variant="link" className="h-auto whitespace-normal px-0">
        <Link to="/agb">Zu den allgemeinen AGB</Link>
      </Button>
    </PageLayout>
  );
}