import { describe, it, expect } from "vitest";
import { ticketSupportSchema } from "@/lib/ticketSupport";
const valid = { orderNumber: "NL-123", firstName: "Test", lastName: "Gast", email: "test@example.invalid", website: "" };
describe("Missing ticket request", () => {
  for (const field of ["orderNumber", "firstName", "lastName", "email"]) {
    it(`requires ${field}`, () => expect(ticketSupportSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false));
  }
  it("rejects invalid email", () => expect(ticketSupportSchema.safeParse({ ...valid, email: "abc" }).success).toBe(false));
  it("rejects honeypot submissions", () => expect(ticketSupportSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false));
  it("keeps the supplied order reference", () => expect(ticketSupportSchema.parse(valid).orderNumber).toBe("NL-123"));
});