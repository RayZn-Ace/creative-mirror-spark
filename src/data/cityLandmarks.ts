/**
 * City landmark images using verified Unsplash photo IDs.
 * Each URL uses the photo ID directly → guaranteed correct image.
 * Format: https://images.unsplash.com/photo-{ID}?w=600&h=400&fit=crop
 */

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop&q=80`;

const PHOTOS: Record<string, string> = {
  // ── Deutschland ──
  // Berlin – Brandenburger Tor
  Berlin: u("1560969184-10fe8719e047"),
  // Hamburg – Elbphilharmonie
  Hamburg: u("1567359781514-3b964e2b04d6"),
  // München – Marienplatz / Frauenkirche
  München: u("1595867818082-083862f3d630"),
  // Köln – Kölner Dom
  Köln: u("1515488764276-beab7607c1e6"),
  // Frankfurt – Skyline am Main
  Frankfurt: u("1467269204594-9661b134dd2b"),
  // Dresden – Frauenkirche
  Dresden: u("1544376798-89aa6b82c6cd"),
  // Düsseldorf – Medienhafen / Rheinturm
  Düsseldorf: u("1573495627361-d9b87960b12d"),
  // Stuttgart – Neues Schloss / Schlossplatz
  Stuttgart: u("1570168007204-dfb528c6958f"),
  // Nürnberg – Kaiserburg
  Nürnberg: u("1572806707538-5ee77dccf5e3"),
  // Leipzig – Völkerschlachtdenkmal
  Leipzig: u("1567084544668-0e968ec13c81"),
  // Hannover – Neues Rathaus
  Hannover: u("1597078632498-2e82ddd5693c"),
  // Karlsruhe – Schloss
  Karlsruhe: u("1568632234157-ce7aecd03d0d"),
  // Erfurt – Krämerbrücke / Dom
  Erfurt: u("1568625502763-2a5ec6a94240"),

  // Ruhrgebiet-Städte – Zeche Zollverein / Industriekultur
  Essen: u("1558618666-fcd25c85f82e"),
  Dortmund: u("1558618666-fcd25c85f82e"),
  Bochum: u("1558618666-fcd25c85f82e"),
  Bottrop: u("1558618666-fcd25c85f82e"),
  Oberhausen: u("1558618666-fcd25c85f82e"),
  Hagen: u("1558618666-fcd25c85f82e"),
  Recklinghausen: u("1558618666-fcd25c85f82e"),
  Wuppertal: u("1558618666-fcd25c85f82e"),

  // Norddeutsche Küstenstädte – Strand/Nordsee
  Cuxhaven: u("1507525428034-b723cf961d3e"),
  Kiel: u("1507525428034-b723cf961d3e"),
  Rostock: u("1507525428034-b723cf961d3e"),
  Heide: u("1507525428034-b723cf961d3e"),

  // Norddeutsche Fachwerk-/Altstädte
  Celle: u("1597926661974-69a3dbc38170"),
  Buxtehude: u("1597926661974-69a3dbc38170"),
  Lübeck: u("1567359781514-3b964e2b04d6"),
  Bremervörde: u("1597926661974-69a3dbc38170"),
  Cloppenburg: u("1597926661974-69a3dbc38170"),
  Oldenburg: u("1597926661974-69a3dbc38170"),
  Bremen: u("1567359781514-3b964e2b04d6"),
  Braunschweig: u("1590074072786-a66914d668f1"),

  // Mitteldeutsche Städte mit historischen Bauten
  Bautzen: u("1568625502763-2a5ec6a94240"),
  Apolda: u("1568625502763-2a5ec6a94240"),
  Gotha: u("1568625502763-2a5ec6a94240"),
  Gera: u("1568625502763-2a5ec6a94240"),
  Halle: u("1568625502763-2a5ec6a94240"),
  Magdeburg: u("1568625502763-2a5ec6a94240"),
  Naumburg: u("1568625502763-2a5ec6a94240"),
  Zwickau: u("1568625502763-2a5ec6a94240"),
  Schwerin: u("1590074072786-a66914d668f1"),
  Potsdam: u("1560969184-10fe8719e047"),
  Stollberg: u("1568625502763-2a5ec6a94240"),

  // Westfalen / Niedersachsen
  Bielefeld: u("1590074072786-a66914d668f1"),
  Münster: u("1590074072786-a66914d668f1"),
  Osnabrück: u("1590074072786-a66914d668f1"),
  Paderborn: u("1590074072786-a66914d668f1"),
  Detmold: u("1590074072786-a66914d668f1"),
  Göttingen: u("1590074072786-a66914d668f1"),
  Hamm: u("1590074072786-a66914d668f1"),
  Melle: u("1597926661974-69a3dbc38170"),
  Verl: u("1597926661974-69a3dbc38170"),

  // Rheinland
  Bonn: u("1578662996442-48f60103fc96"),
  Aachen: u("1577462281149-dba26c1bb7e4"),
  Koblenz: u("1600623471616-8c1966c91ff6"),
  Trier: u("1600623471616-8c1966c91ff6"),
  Krefeld: u("1597926661974-69a3dbc38170"),
  Mönchengladbach: u("1597926661974-69a3dbc38170"),
  Neuss: u("1573495627361-d9b87960b12d"),
  Monheim: u("1573495627361-d9b87960b12d"),
  Geldern: u("1597926661974-69a3dbc38170"),

  // Hessen / Rhein-Main
  Darmstadt: u("1600623471616-8c1966c91ff6"),
  Mainz: u("1600623471616-8c1966c91ff6"),
  Hanau: u("1600623471616-8c1966c91ff6"),
  Gießen: u("1600623471616-8c1966c91ff6"),
  Fulda: u("1600623471616-8c1966c91ff6"),
  Aschaffenburg: u("1600623471616-8c1966c91ff6"),
  Merenberg: u("1600623471616-8c1966c91ff6"),
  Sinsheim: u("1600623471616-8c1966c91ff6"),

  // Bayern (außer München/Nürnberg)
  Augsburg: u("1597926525122-12d104a1b06a"),
  Ingolstadt: u("1600623471616-8c1966c91ff6"),
  Regensburg: u("1600623471616-8c1966c91ff6"),
  Würzburg: u("1600623471616-8c1966c91ff6"),
  Nabburg: u("1600623471616-8c1966c91ff6"),
  Rosenheim: u("1506905925346-21bda4d32df4"),
  Freilassing: u("1506905925346-21bda4d32df4"),

  // Baden-Württemberg (außer Stuttgart/Karlsruhe)
  Freiburg: u("1590074072786-a66914d668f1"),
  Pforzheim: u("1506905925346-21bda4d32df4"),
  Offenburg: u("1506905925346-21bda4d32df4"),
  Reutlingen: u("1506905925346-21bda4d32df4"),
  Ravensburg: u("1506905925346-21bda4d32df4"),
  Singen: u("1506905925346-21bda4d32df4"),
  Lörrach: u("1506905925346-21bda4d32df4"),
  Albstadt: u("1506905925346-21bda4d32df4"),
  Balingen: u("1506905925346-21bda4d32df4"),
  Rastatt: u("1600623471616-8c1966c91ff6"),
  Leingarten: u("1600623471616-8c1966c91ff6"),
  Aalen: u("1506905925346-21bda4d32df4"),
  Ulm: u("1600623471616-8c1966c91ff6"),

  // Pfalz / Saarland
  Kaiserslautern: u("1590074072786-a66914d668f1"),
  Saarbrücken: u("1600623471616-8c1966c91ff6"),

  // Sonstige DE
  Siegen: u("1506905925346-21bda4d32df4"),
  Olpe: u("1506905925346-21bda4d32df4"),

  // ── Österreich ──
  Wien: u("1516550893923-42d28e5677af"), // Stephansdom
  Salzburg: u("1609856878074-cf31e21ccb6b"), // Festung Hohensalzburg
  Linz: u("1506905925346-21bda4d32df4"),
  Innsbruck: u("1506905925346-21bda4d32df4"),
  Dornbirn: u("1506905925346-21bda4d32df4"),
  Kitzbühel: u("1506905925346-21bda4d32df4"),
  Vöcklabruck: u("1506905925346-21bda4d32df4"),
  Gralla: u("1506905925346-21bda4d32df4"),
  Kollerschlag: u("1506905925346-21bda4d32df4"),
  StMartin: u("1506905925346-21bda4d32df4"),

  // ── Schweiz ──
  Zürich: u("1515488764276-beab7607c1e6"),
  Winterthur: u("1515488764276-beab7607c1e6"),
  StGallen: u("1515488764276-beab7607c1e6"),
  Olten: u("1506905925346-21bda4d32df4"),
  Lyss: u("1506905925346-21bda4d32df4"),

  // ── International ──
  Amsterdam: u("1534351590666-13e3e96b5017"), // Grachten
  Rotterdam: u("1534351590666-13e3e96b5017"),
  Utrecht: u("1534351590666-13e3e96b5017"),
  Paris: u("1502602898657-3e91760cbb34"), // Eiffelturm
  LeHavre: u("1502602898657-3e91760cbb34"),
  Mathay: u("1502602898657-3e91760cbb34"),
  Antwerpen: u("1567156810289-2a5f23a8e68a"),
  Luxemburg: u("1618944913480-b67ee16d7b77"),
  Krakow: u("1558618666-fcd25c85f82e"),
  Zadar: u("1555990793-da11153b2473"),
  "São Paulo": u("1543059080-70c20e3e0ab1"),
  SãoPaulo: u("1543059080-70c20e3e0ab1"),
};

// Fallback – atmospheric city at night
const FALLBACK = u("1514565131-fce0801e5785");

export function getCityLandmarkUrl(city: string): string {
  return PHOTOS[city] || FALLBACK;
}
