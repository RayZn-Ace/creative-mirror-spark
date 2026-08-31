export interface PartnerPermission {
  key: string;
  label: string;
  description: string;
}

export const PARTNER_PERMISSIONS: PartnerPermission[] = [
  { key: "events", label: "Events", description: "Übersicht der Events mit Datum, Stadt & Location" },
  { key: "tickets", label: "Tickets", description: "Verkaufte Tickets & Bestellungen pro Event" },
  { key: "revenue", label: "Umsatz", description: "Umsatzzahlen (heute, 7 Tage, Monat, gesamt)" },
  { key: "checkins", label: "Check-ins", description: "Einlass-Quote der Tickets" },
  { key: "capacity", label: "Auslastung", description: "Verkauft vs. Kapazität pro Ticket-Kategorie" },
  { key: "lounges", label: "Lounges", description: "VIP-Lounge-Buchungen und Status" },
  { key: "media", label: "Partymomente", description: "Foto- & Video-Alben" },
  { key: "waitlist", label: "Warteliste", description: "Anzahl Wartelisten-Eintragungen pro Event" },
];

export const permissionLabel = (key: string) =>
  PARTNER_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
