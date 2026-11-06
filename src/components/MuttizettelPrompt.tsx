import { Link } from "react-router-dom";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventAge } from "@/lib/eventAge";

export default function MuttizettelPrompt({ is16plus, eventId }: { is16plus: boolean | null; eventId: string }) {
  if (getEventAge(is16plus) !== 16) return null;
  return <section className="space-y-3 border-t border-border pt-4">
    <p className="text-sm font-medium text-foreground">Du bist unter 18? Hier Muttizettel ausfüllen und vorbereitet sein!</p>
    <Button asChild variant="outline" className="w-full sm:w-auto">
      <Link to={`/muttizettel?event=${encodeURIComponent(eventId)}`}><FilePenLine className="mr-2 h-4 w-4" />Muttizettel ausfüllen</Link>
    </Button>
  </section>;
}