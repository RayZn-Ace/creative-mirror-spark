export interface PrintPerson { name: string; address: string; phone: string; birthday: string; email?: string; }
export interface PrintMuttizettelData {
  eventTitle: string; eventDate: string;
  parent: PrintPerson; minor: PrintPerson; supervisor: PrintPerson;
  parentSignature: string | null; supervisorSignature: string | null;
}

/** Personal data stays in a temporary same-origin document, never on the server. */
export function printMuttizettel(data: PrintMuttizettelData) {
  const frame = document.createElement("iframe");
  frame.title = "Muttizettel Druckausgabe";
  frame.hidden = true;
  document.body.append(frame);
  const doc = frame.contentDocument;
  const printWindow = frame.contentWindow;
  if (!doc || !printWindow) { frame.remove(); throw new Error("Druckausgabe konnte nicht geöffnet werden."); }
  doc.title = `Muttizettel – ${data.eventTitle}`;
  const add = (tag: string, text: string) => {
    const node = doc.createElement(tag); node.textContent = text; doc.body.append(node); return node;
  };
  add("h1", "Nightlife Generation – Erziehungsbeauftragung");
  add("p", "Nach § 1 Abs. 1 Nr. 4 Jugendschutzgesetz (JuSchG)");
  add("h2", data.eventTitle);
  add("p", `Veranstaltungsdatum: ${data.eventDate}`);
  for (const [title, person] of [["Sorgeberechtigte Person", data.parent], ["Minderjährige Person", data.minor], ["Volljährige Begleitperson (18+)", data.supervisor]] as const) {
    add("h3", title);
    add("p", `Name: ${person.name || "________________________________"}`);
    add("p", `Anschrift: ${person.address || "________________________________"}`);
    add("p", `Geburtsdatum: ${person.birthday || "________________"} · Telefon: ${person.phone || "________________"}`);
    if (person.email) add("p", `E-Mail: ${person.email}`);
  }
  add("p", "Als sorgeberechtigte Person beauftrage ich die oben genannte volljährige Begleitperson, die Aufsicht über die minderjährige Person während dieser Veranstaltung zu übernehmen. Die Begleitperson bestätigt die Übernahme der Aufsicht und bleibt während des Aufenthalts anwesend.");
  add("p", "Ort, Datum: ____________________________________________");
  for (const [label, signature] of [["Unterschrift der sorgeberechtigten Person", data.parentSignature], ["Unterschrift der volljährigen Begleitperson", data.supervisorSignature]] as const) {
    if (signature?.startsWith("data:image/png;base64,")) {
      const img = doc.createElement("img"); img.src = signature; img.alt = label; img.width = 220; img.height = 65; doc.body.append(img);
    }
    add("p", `________________________________ · ${label}`);
  }
  add("p", "Vor dem Einlass vollständig ergänzen und von den beteiligten Personen unterschreiben lassen. Ausweise zum Altersnachweis mitbringen. Die Einlassregeln der Veranstaltung gelten weiterhin.");
  const images = [...doc.images];
  Promise.all(images.map(img => img.decode().catch(() => undefined))).then(() => {
    printWindow.focus(); printWindow.print();
    // Browsers may open print asynchronously; retain the document until afterprint.
  });
  printWindow.addEventListener("afterprint", () => frame.remove(), { once: true });
}