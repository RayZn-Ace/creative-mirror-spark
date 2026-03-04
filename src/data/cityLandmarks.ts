/**
 * City landmark images – locally generated, stored in public/images/cities/.
 * Maps city name → image path. Falls back to a generic German town image.
 */

const LOCAL: Record<string, string> = {
  // Major German cities with dedicated images
  Berlin: "/images/cities/berlin.jpg",
  Hamburg: "/images/cities/hamburg.jpg",
  München: "/images/cities/muenchen.jpg",
  Köln: "/images/cities/koeln.jpg",
  Frankfurt: "/images/cities/frankfurt.jpg",
  Dresden: "/images/cities/dresden.jpg",
  Düsseldorf: "/images/cities/duesseldorf.jpg",
  Stuttgart: "/images/cities/stuttgart.jpg",
  Nürnberg: "/images/cities/nuernberg.jpg",
  Leipzig: "/images/cities/leipzig.jpg",
  Hannover: "/images/cities/hannover.jpg",
  Karlsruhe: "/images/cities/karlsruhe.jpg",
  Erfurt: "/images/cities/erfurt.jpg",
  Essen: "/images/cities/essen.jpg",
  Bonn: "/images/cities/bonn.jpg",
  Aachen: "/images/cities/aachen.jpg",
  Dortmund: "/images/cities/dortmund.jpg",
  Bochum: "/images/cities/bochum.jpg",
  Augsburg: "/images/cities/augsburg.jpg",
  Darmstadt: "/images/cities/darmstadt.jpg",
  Bautzen: "/images/cities/bautzen.jpg",
  Bottrop: "/images/cities/bottrop.jpg",
  Celle: "/images/cities/celle.jpg",
  Braunschweig: "/images/cities/braunschweig.jpg",
  Detmold: "/images/cities/detmold.jpg",
  Bielefeld: "/images/cities/bielefeld.jpg",

  // Österreich
  Wien: "/images/cities/wien.jpg",
  Salzburg: "/images/cities/salzburg.jpg",

  // Schweiz
  Zürich: "/images/cities/zuerich.jpg",

  // International
  Amsterdam: "/images/cities/amsterdam.jpg",
  Paris: "/images/cities/paris.jpg",
};

const FALLBACK = "/images/cities/default.jpg";

export function getCityLandmarkUrl(city: string): string {
  return LOCAL[city] || FALLBACK;
}
