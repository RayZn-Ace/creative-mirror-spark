import { z } from "zod";

export const ticketSupportSchema = z.object({
  orderNumber: z.string().trim().min(1, "Bitte gib deine Bestellnummer ein.").max(100, "Die Bestellnummer ist zu lang.").regex(/^[\p{L}\p{N}\s._/#-]+$/u, "Bitte prüfe deine Bestellnummer."),
  firstName: z.string().trim().min(1, "Bitte gib deinen Vornamen ein.").max(100),
  lastName: z.string().trim().min(1, "Bitte gib deinen Nachnamen ein.").max(100),
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein.").max(255).transform(value => value.toLowerCase()),
  website: z.string().max(0, "Die Anfrage konnte nicht gesendet werden.").default(""),
});