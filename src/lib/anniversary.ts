/**
 * 2-Jähriges Jubiläum – Sondermodus.
 * Läuft automatisch bis zum Ende des 20.09.2026 (Berliner Zeit),
 * danach zeigt die Seite wieder das Standarddesign.
 */

// Ende: 20.09.2026, 23:59:59 (Berlin = UTC+2)
export const ANNIVERSARY_END = new Date("2026-09-20T23:59:59+02:00");

export const ANNIVERSARY_TITLE = "2 YEARS ANNIVERSARY";
export const ANNIVERSARY_SUBTITLE = "Zwei Jahre Nightlife Generation – wir feiern mit euch!";
export const ANNIVERSARY_BADGE = "2 JAHRE NIGHTLIFE";

export function isAnniversaryActive(now: Date = new Date()): boolean {
  return now.getTime() <= ANNIVERSARY_END.getTime();
}
