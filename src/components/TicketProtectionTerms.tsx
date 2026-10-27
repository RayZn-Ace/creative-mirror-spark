import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function TicketProtectionTerms() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-foreground">
      <section className="space-y-2">
        <h3 className="font-semibold">1. Geltung und Buchung</h3>
        <p>Diese ergänzenden Bedingungen gelten für den optionalen Nightlife-Ticketschutz, wenn dieser beim Ticketkauf mitgebucht und bezahlt wurde. Er gilt ausschließlich für die damit geschützten Tickets der gebuchten Veranstaltung. Eine nachträgliche Buchung für einen bereits eingetretenen oder bei Buchung bekannten Ausfallgrund ist ausgeschlossen.</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">2. Wann eine Erstattung möglich ist</h3>
        <p>Eine Erstattung kommt nur in Betracht, wenn du die Veranstaltung wegen einer nach der Buchung unerwartet eingetretenen Krankheit oder eines Unfalls nicht besuchen kannst. Ebenfalls erfasst ist der Tod eines nahen Angehörigen (Eltern, Kinder, Geschwister, Ehe- oder Lebenspartner). Der jeweilige Grund muss die Teilnahme unmöglich oder unzumutbar machen und durch einen geeigneten Beleg nachgewiesen werden.</p>
        <p>Keine Erstattung gibt es bei bloßer Meinungsänderung, fehlender Begleitung, Terminüberschneidungen, vergessenen Tickets, gewöhnlichen Anreiseproblemen oder verweigertem Einlass wegen nicht erfüllter Alters-, Ausweis- oder Hausordnungsanforderungen. Andere, hier nicht genannte Gründe sind nicht vom Ticketschutz erfasst.</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">3. Erstattungsbetrag und Gebühren</h3>
        <p>Bei einem anerkannten Ausfallgrund wird der tatsächlich gezahlte Eintrittspreis des betroffenen, ungenutzten Tickets erstattet. Bereits im Kauf ausgewiesene Service-, Buchungs- und Zahlungsgebühren sowie der Beitrag für den Ticketschutz werden nicht erstattet. Es werden keine zusätzlichen, erst nachträglich festgelegten Bearbeitungsgebühren abgezogen. Rabatte werden berücksichtigt; eine doppelte Erstattung ist ausgeschlossen.</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">4. Antrag und erforderliche Belege</h3>
        <p>Melde den Ausfall bitte unverzüglich nach Bekanntwerden über Sophia oder den offiziellen Nightlife-WhatsApp-Support. Nenne deine Bestellnummer, das betroffene Ticket und den Ausfallgrund. Für eine Erstattung musst du einen geeigneten Beleg vorlegen, etwa eine ärztliche Bescheinigung, die bestätigt, dass du am Veranstaltungstag krankheits- oder unfallbedingt nicht teilnehmen kannst, oder einen Nachweis des Todesfalls und des Angehörigenverhältnisses.</p>
        <p>Eine Diagnose oder ausführliche Krankengeschichte ist nicht erforderlich. Übermittle keine Gesundheitsunterlagen unaufgefordert im Chat; der Support stimmt mit dir einen geeigneten, geschützten Übermittlungsweg ab. Schwärze Angaben, die für die Prüfung nicht erforderlich sind. Ohne ausreichenden Nachweis ist keine Erstattung aus dem Ticketschutz möglich.</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">5. Prüfung und gesetzliche Rechte</h3>
        <p>Die Auszahlung erfolgt nach Prüfung und Anerkennung des Antrags; mit der Erstattung verliert das betroffene Ticket seine Gültigkeit. Bereits eingelöste oder anderweitig erstattete Tickets sind ausgeschlossen. Gesetzliche Ansprüche, insbesondere bei einer Absage der Veranstaltung, bleiben unberührt; die vorstehenden Gebührenausschlüsse beschränken solche Ansprüche nicht. Im Übrigen gelten die allgemeinen AGB.</p>
      </section>
    </div>
  );
}

export function TicketProtectionTermsButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto min-h-9 whitespace-normal text-xs">
          <FileText aria-hidden="true" /> Ticketschutz-AGB lesen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="pr-6">Ticketschutz-AGB</DialogTitle>
          <DialogDescription>Nightlife Generation · Ergänzende Bedingungen zum optionalen Ticketschutz</DialogDescription>
        </DialogHeader>
        <TicketProtectionTerms />
      </DialogContent>
    </Dialog>
  );
}