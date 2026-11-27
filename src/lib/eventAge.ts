import { z } from "zod";

export const eventAgeSelection = z.boolean({ error: "Bitte 16 oder 18 Jahre auswählen." });
export function getEventAge(is16plus: boolean | null | undefined): 16 | 18 | null {
  return is16plus === true ? 16 : is16plus === false ? 18 : null;
}