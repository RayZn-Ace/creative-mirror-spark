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
  ev("Aachen", "BERKS Dancing", "2026-04-11"),
  ev("Aachen", "BERKS Dancing", "2026-08-29"),
  ev("Aachen", "BERKS Dancing", "2026-12-12"),
  ev("Albstadt", "KulturFabrik", "2026-09-26"),
  ev("Apolda", "Klubhaus", "2026-05-30"),
  ev("Augsburg", "Sound-Factory", "2026-05-16"),
  ev("Augsburg", "Sound-Factory", "2026-09-26"),
  ev("Bautzen", "Stadthalle Krone", "2026-09-19"),
  ev("Berlin", "Bricks", "2026-01-30"),
  ev("Berlin", "Bricks", "2026-04-17"),
  ev("Berlin", "Bricks", "2026-07-03"),
  ev("Berlin", "Bricks", "2026-09-05"),
  ev("Berlin", "Bricks", "2026-11-13"),
  ev("Berlin", "Bricks", "2026-12-04"),
  ev("Bielefeld", "Prime", "2026-02-07"),
  ev("Bielefeld", "Prime", "2026-09-12"),
  ev("Bielefeld", "Prime", "2027-01-09"),
  ev("Bochum", "Prater", "2026-05-08"),
  ev("Bochum", "Prater", "2026-09-05"),
  ev("Bochum", "Prater", "2026-12-19"),
  ev("Bonn", "Brückenforum", "2026-05-30"),
  ev("Bonn", "Brückenforum", "2026-10-02"),
  ev("Bonn", "Brückenforum", "2027-04-24"),
  ev("Bottrop", "Lizzy Lou", "2026-05-29"),
  ev("Bottrop", "Lizzy Lou", "2026-11-27"),
  ev("Buxtehude", "Studio 21", "2026-02-28"),
  ev("Buxtehude", "Studio 21", "2026-05-30"),
  ev("Buxtehude", "Studio 21", "2026-09-26"),
  ev("Buxtehude", "Studio 21", "2026-12-05"),
  ev("Darmstadt", "Huckebein", "2026-04-10"),
  ev("Darmstadt", "Huckebein", "2026-10-03"),
  ev("Dortmund", "ClubOne", "2026-03-13"),
  ev("Dortmund", "ClubOne", "2026-09-18"),
  ev("Dortmund", "ClubOne", "2026-12-18"),
  ev("Dresden", "Stromwerk", "2026-06-20"),
  ev("Dresden", "Stromwerk", "2026-12-18"),
  ev("Düsseldorf", "Nachtresidenz", "2026-02-21"),
  ev("Düsseldorf", "Nachtresidenz", "2026-05-09"),
  ev("Düsseldorf", "Nachtresidenz", "2026-08-22"),
  ev("Düsseldorf", "Nachtresidenz", "2026-10-10"),
  ev("Düsseldorf", "Nachtresidenz", "2026-12-12"),
  ev("Erfurt", "Central Club", "2026-09-19"),
  ev("Essen", "Essence", "2026-05-22"),
  ev("Essen", "Essence", "2026-09-11"),
  ev("Essen", "Essence", "2026-12-11"),
  ev("Frankfurt", "Batschkapp", "2026-03-07"),
  ev("Frankfurt", "Batschkapp", "2026-05-30"),
  ev("Frankfurt", "Batschkapp", "2026-09-05"),
  ev("Frankfurt", "Batschkapp", "2026-08-07", "Deutschland", "DE", "Open Air"),
  ev("Frankfurt", "Batschkapp", "2026-10-09"),
  ev("Hamburg", "Große Freiheit 36", "2026-05-23"),
  ev("Hamburg", "Große Freiheit 36", "2026-06-12"),
  ev("Hamburg", "Große Freiheit 36", "2026-06-27"),
  ev("Hamburg", "Große Freiheit 36", "2026-07-18"),
  ev("Hamburg", "Große Freiheit 36", "2026-08-08"),
  ev("Hamburg", "Große Freiheit 36", "2026-08-22"),
  ev("Hamburg", "Große Freiheit 36", "2026-09-05"),
  ev("Hannover", "Baggi", "2026-04-10"),
  ev("Hannover", "Azzurro Beach", "2026-06-19", "Deutschland", "DE", "Open Air"),
  ev("Hannover", "Baggi", "2026-08-21"),
  ev("Hannover", "Baggi", "2026-10-23"),
  ev("Hannover", "Baggi", "2026-12-04"),
  ev("Karlsruhe", "Agostea", "2026-02-27"),
  ev("Karlsruhe", "Agostea", "2026-05-08"),
  ev("Karlsruhe", "Agostea", "2026-08-21"),
  ev("Karlsruhe", "Agostea", "2026-11-06"),
  ev("Köln", "Nachtflug", "2026-03-14"),
  ev("Köln", "Nachtflug", "2026-05-16"),
  ev("Köln", "Nachtflug", "2026-07-11"),
  ev("Köln", "Nachtflug", "2026-09-04"),
  ev("Köln", "Nachtflug", "2026-10-10"),
  ev("Köln", "Nachtflug", "2026-11-13"),
  ev("Köln", "Nachtflug", "2026-12-11"),
  ev("Leipzig", "Spizz / Westbad", "2026-02-06"),
  ev("Leipzig", "Spizz / Westbad", "2026-05-30"),
  ev("Leipzig", "Spizz / Westbad", "2026-11-07"),
  ev("München", "Filmcasino", "2026-05-09"),
  ev("München", "Filmcasino", "2026-06-27"),
  ev("München", "Filmcasino", "2026-09-26"),
  ev("München", "Filmcasino", "2026-10-17"),
  ev("München", "Filmcasino", "2026-11-14"),
  ev("München", "Filmcasino", "2026-12-19"),
  ev("Nürnberg", "Gate", "2026-05-15"),
  ev("Nürnberg", "Gate", "2026-07-18"),
  ev("Nürnberg", "Gate", "2026-09-05"),
  ev("Nürnberg", "Gate", "2026-12-04"),
  ev("Stuttgart", "Perkins Park", "2026-03-27"),
  ev("Stuttgart", "Perkins Park", "2026-05-22"),
  ev("Stuttgart", "Perkins Park", "2026-07-25"),
  ev("Stuttgart", "Perkins Park", "2026-09-18"),
  ev("Stuttgart", "Perkins Park", "2026-10-23"),
  ev("Stuttgart", "Perkins Park", "2026-11-27"),
  ev("Stuttgart", "Perkins Park", "2026-12-11"),
  // Österreich
  ev("Wien", "O-der Klub", "2026-03-14", "Österreich", "AT"),
  ev("Wien", "O-der Klub", "2026-06-20", "Österreich", "AT"),
  ev("Wien", "O-der Klub", "2026-09-12", "Österreich", "AT"),
  ev("Wien", "O-der Klub", "2026-12-05", "Österreich", "AT"),
  ev("Salzburg", "City Beats", "2026-03-07", "Österreich", "AT"),
  ev("Salzburg", "City Beats", "2026-05-23", "Österreich", "AT"),
  ev("Linz", "Le Jardin", "2026-04-05", "Österreich", "AT"),
  ev("Linz", "Le Jardin", "2026-10-25", "Österreich", "AT"),
  // Schweiz
  ev("Zürich", "Sektor 11", "2026-04-25", "Schweiz", "CH"),
  ev("Zürich", "Sektor 11", "2026-08-15", "Schweiz", "CH"),
  ev("Zürich", "Sektor 11", "2026-11-21", "Schweiz", "CH"),
  // Niederlande
  ev("Amsterdam", "Panama", "2026-04-18", "Niederlande", "NL"),
  ev("Amsterdam", "Panama", "2026-10-03", "Niederlande", "NL"),
  // Frankreich
  ev("Paris", "Movida", "2026-06-27", "Frankreich", "FR"),
  // Belgien
  ev("Antwerpen", "Ikon", "2026-07-25", "Belgien", "BE"),
  // Luxemburg
  ev("Luxemburg", "Vanity Club", "2026-07-11", "Luxemburg", "LU"),
  // Polen
  ev("Krakow", "Gorzko Gorzko", "2026-06-19", "Polen", "PL"),
  // Kroatien
  ev("Zadar", "Guma Club", "2026-07-25", "Kroatien", "HR"),
  // Brasilien
  ev("São Paulo", "Club A", "2026-08-08", "Brasilien", "BR"),
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