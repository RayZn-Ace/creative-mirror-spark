import { describe, it, expect } from "vitest";
import { eventAgeSelection, getEventAge } from "@/lib/eventAge";
describe("Explicit event age", () => {
  it("rejects a new event without selection", () => expect(eventAgeSelection.safeParse(null).success).toBe(false));
  it("rejects a missing selection during editing", () => expect(eventAgeSelection.safeParse(undefined).success).toBe(false));
  it("preserves 16", () => { expect(eventAgeSelection.parse(true)).toBe(true); expect(getEventAge(true)).toBe(16); });
  it("preserves 18", () => { expect(eventAgeSelection.parse(false)).toBe(false); expect(getEventAge(false)).toBe(18); });
  it("does not invent an age for unknown data", () => expect(getEventAge(null)).toBeNull());
});