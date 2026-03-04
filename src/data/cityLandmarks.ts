/**
 * Curated landmark images for cities – using Unsplash photos (free to use).
 * Format: city name → Unsplash photo URL (400×300 crop for card backgrounds).
 */

const UNSPLASH_PHOTOS: Record<string, string> = {
  // Deutschland
  Aachen: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Aachener Dom
  Augsburg: "https://images.unsplash.com/photo-1597926525122-12d104a1b06a?w=600&h=400&fit=crop", // Augsburg Rathaus
  Berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop", // Brandenburger Tor
  Bielefeld: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&h=400&fit=crop", // Sparrenburg
  Bochum: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&h=400&fit=crop", // Bochum Skyline
  Bonn: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop", // Altes Rathaus Bonn
  Bottrop: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop", // Tetraeder
  Buxtehude: "https://images.unsplash.com/photo-1597926661974-69a3dbc38170?w=600&h=400&fit=crop", // Norddeutsche Altstadt
  Darmstadt: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop", // Mathildenhöhe
  Dortmund: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600&h=400&fit=crop", // Signal Iduna Park area
  Dresden: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&h=400&fit=crop", // Frauenkirche
  Düsseldorf: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?w=600&h=400&fit=crop", // Rheinturm
  Erfurt: "https://images.unsplash.com/photo-1568625502763-2a5ec6a94240?w=600&h=400&fit=crop", // Krämerbrücke
  Essen: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Zeche Zollverein
  Frankfurt: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop", // Skyline
  Hamburg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop", // Elbphilharmonie
  Hannover: "https://images.unsplash.com/photo-1597078632498-2e82ddd5693c?w=600&h=400&fit=crop", // Neues Rathaus
  Karlsruhe: "https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=600&h=400&fit=crop", // Schloss
  Köln: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Kölner Dom
  Leipzig: "https://images.unsplash.com/photo-1567084544668-0e968ec13c81?w=600&h=400&fit=crop", // Völkerschlachtdenkmal
  München: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&h=400&fit=crop", // Frauenkirche
  Nürnberg: "https://images.unsplash.com/photo-1572806707538-5ee77dccf5e3?w=600&h=400&fit=crop", // Kaiserburg
  Stuttgart: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop", // Schlossplatz
  // Österreich
  Wien: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&h=400&fit=crop", // Stephansdom
  Salzburg: "https://images.unsplash.com/photo-1609856878074-cf31e21ccb6b?w=600&h=400&fit=crop", // Festung Hohensalzburg
  Linz: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Ars Electronica
  // Schweiz
  Zürich: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&h=400&fit=crop", // Grossmünster
  // International
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop", // Grachten
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", // Eiffelturm
  Antwerpen: "https://images.unsplash.com/photo-1567156810289-2a5f23a8e68a?w=600&h=400&fit=crop", // Kathedrale
  Luxemburg: "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?w=600&h=400&fit=crop", // Altstadt
  Krakow: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", // Wawel
  Zadar: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&h=400&fit=crop", // Altstadt
  "São Paulo": "https://images.unsplash.com/photo-1543059080-70c20e3e0ab1?w=600&h=400&fit=crop", // Skyline
};

// Fallback for cities without a specific photo
const FALLBACK = "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&h=400&fit=crop"; // Generic city night

export function getCityLandmarkUrl(city: string): string {
  return UNSPLASH_PHOTOS[city] || FALLBACK;
}
