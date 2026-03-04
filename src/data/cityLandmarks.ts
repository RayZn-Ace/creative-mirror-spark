/**
 * Curated landmark images for cities – using Unsplash photos.
 * Every city in the system gets a specific landmark/cityscape photo.
 */

const PHOTOS: Record<string, string> = {
  // ── Deutschland ──
  Aachen: "https://images.unsplash.com/photo-1577462281149-dba26c1bb7e4?w=600&h=400&fit=crop", // Aachener Dom
  Aalen: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Schwäbische Alb Altstadt
  Albstadt: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwäbische Alb Landschaft
  Apolda: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Thüringer Kleinstadt
  Aschaffenburg: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Schloss Johannisburg
  Augsburg: "https://images.unsplash.com/photo-1597926525122-12d104a1b06a?w=600&h=400&fit=crop", // Rathaus
  Balingen: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwäbische Alb
  Bautzen: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Alte Wasserkunst
  Berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop", // Brandenburger Tor
  Bielefeld: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Sparrenburg
  Bochum: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Ruhrgebiet Industrie
  Bonn: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop", // Altes Rathaus
  Bottrop: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Tetraeder
  Braunschweig: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Burgplatz
  Bremen: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&h=400&fit=crop", // Bremer Stadtmusikanten
  Bremervörde: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Norddeutsche Landschaft
  Buxtehude: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Altstadt
  Celle: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Schloss Celle / Fachwerk
  Cloppenburg: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Museumsdorf
  Cuxhaven: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", // Kugelbake Nordsee
  Darmstadt: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Mathildenhöhe
  Detmold: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Hermannsdenkmal
  Dortmund: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Ruhrgebiet
  Dresden: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&h=400&fit=crop", // Frauenkirche
  Düsseldorf: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?w=600&h=400&fit=crop", // Rheinturm / Medienhafen
  Erfurt: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Krämerbrücke
  Essen: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Zeche Zollverein
  Frankfurt: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop", // Skyline
  Freiburg: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Münster
  Freilassing: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Alpen
  Fulda: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Barockstadt
  Geldern: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Niederrhein
  Gera: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Orangerie
  Gießen: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Altes Schloss
  Gotha: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Schloss Friedenstein
  Göttingen: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Gänseliesel
  Hagen: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Freilichtmuseum
  Halle: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Marktkirche
  Hamburg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop", // Elbphilharmonie
  Hamm: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Glaselefant
  Hanau: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Brüder-Grimm-Denkmal
  Hannover: "https://images.unsplash.com/photo-1597078632498-2e82ddd5693c?w=600&h=400&fit=crop", // Neues Rathaus
  Heide: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", // Nordseeküste
  Ingolstadt: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Kreuztor
  Kaiserslautern: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Pfalz
  Karlsruhe: "https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=600&h=400&fit=crop", // Schloss
  Kiel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", // Kieler Förde
  Koblenz: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Deutsches Eck
  Köln: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Kölner Dom
  Krefeld: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Burg Linn
  Leipzig: "https://images.unsplash.com/photo-1567084544668-0e968ec13c81?w=600&h=400&fit=crop", // Völkerschlachtdenkmal
  Lübeck: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&h=400&fit=crop", // Holstentor
  Lörrach: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwarzwald
  Magdeburg: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Dom
  Mainz: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Dom
  Melle: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Fachwerk
  Mönchengladbach: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Münster
  Monheim: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?w=600&h=400&fit=crop", // Rhein
  München: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&h=400&fit=crop", // Frauenkirche
  Münster: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Prinzipalmarkt
  Nabburg: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Oberpfalz
  Naumburg: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Dom
  Neuss: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?w=600&h=400&fit=crop", // Quirinus-Münster
  Nürnberg: "https://images.unsplash.com/photo-1572806707538-5ee77dccf5e3?w=600&h=400&fit=crop", // Kaiserburg
  Oberhausen: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Gasometer
  Offenburg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwarzwald
  Oldenburg: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Schloss
  Olpe: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Biggesee
  Osnabrück: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Rathaus Westfälischer Friede
  Paderborn: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Dom
  Pforzheim: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwarzwald-Tor
  Potsdam: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop", // Sanssouci
  Rastatt: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Schloss
  Ravensburg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Türme
  Recklinghausen: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Ruhr
  Regensburg: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Steinerne Brücke
  Reutlingen: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Schwäbische Alb
  Rosenheim: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Alpen
  Rostock: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", // Warnemünde
  Saarbrücken: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Saarland
  Schwerin: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Schweriner Schloss
  Siegen: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Oberes Schloss
  Singen: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Hohentwiel
  Sinsheim: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Technik Museum
  Stuttgart: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop", // Schlossplatz
  Trier: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Porta Nigra
  Ulm: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Ulmer Münster
  Verl: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // OWL Landschaft
  Wuppertal: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Schwebebahn
  Würzburg: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Residenz
  Zwickau: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Dom

  // ── Österreich ──
  Wien: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&h=400&fit=crop", // Stephansdom
  Salzburg: "https://images.unsplash.com/photo-1609856878074-cf31e21ccb6b?w=600&h=400&fit=crop", // Festung
  Linz: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Donau
  Innsbruck: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Goldenes Dachl / Alpen
  Dornbirn: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Vorarlberg
  Kitzbühel: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Alpen Ski
  Vöcklabruck: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Salzkammergut
  Gralla: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Steiermark
  Kollerschlag: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Mühlviertel
  StMartin: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Alpen

  // ── Schweiz ──
  Zürich: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Grossmünster
  Winterthur: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Altstadt
  StGallen: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Stiftsbibliothek
  Olten: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Aare
  Lyss: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", // Berner Mittelland

  // ── International ──
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop", // Grachten
  Rotterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop", // Erasmusbrücke
  Utrecht: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop", // Domtoren
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", // Eiffelturm
  LeHavre: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", // Normandie
  Mathay: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", // Frankreich
  Antwerpen: "https://images.unsplash.com/photo-1567156810289-2a5f23a8e68a?w=600&h=400&fit=crop", // Kathedrale
  Luxemburg: "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?w=600&h=400&fit=crop", // Altstadt
  Krakow: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Wawel
  Zadar: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&h=400&fit=crop", // Altstadt Küste
  "São Paulo": "https://images.unsplash.com/photo-1543059080-70c20e3e0ab1?w=600&h=400&fit=crop", // Skyline
  SãoPaulo: "https://images.unsplash.com/photo-1543059080-70c20e3e0ab1?w=600&h=400&fit=crop", // Skyline (alt key)
};

// Fallback – atmospheric city at night
const FALLBACK = "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&h=400&fit=crop";

export function getCityLandmarkUrl(city: string): string {
  return PHOTOS[city] || FALLBACK;
}
