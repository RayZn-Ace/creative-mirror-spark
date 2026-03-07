export interface GimmeEvent {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  locationName: string;
  address?: string;
  date: string;
  doorsOpen?: string;
  ticketLink: string;
  status: "planned" | "soldout" | "postponed" | "cancelled";
  extras?: string;
}

export const defaultTicketLink = "https://mammamia-partymotto.ticket.io/?view=table";

let _id = 0;
function ev(city: string, locationName: string, date: string, country = "Deutschland", countryCode = "DE", extras?: string): GimmeEvent {
  _id++;
  return { id: String(_id), city, country, countryCode, locationName, date: date + "T21:00:00", ticketLink: defaultTicketLink, status: "planned", extras };
}

export const events: GimmeEvent[] = [
];
export function getNextEvent(): GimmeEvent | undefined {
  const now = new Date();
  return events
    .filter(e => e.status === "planned" && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
}

export function getEventsByCountry(country: string): GimmeEvent[] {
  return events.filter(e => e.country === country);
}