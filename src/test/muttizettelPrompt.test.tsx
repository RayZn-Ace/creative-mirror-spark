import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MuttizettelPrompt from "@/components/MuttizettelPrompt";

afterEach(cleanup);
describe("Muttizettel age eligibility", () => {
  const show = (age: boolean | null) => render(<MemoryRouter><MuttizettelPrompt is16plus={age} eventId="event-16" /></MemoryRouter>);
  it("allows the event-linked form for stored 16", () => { show(true); expect(screen.getByRole("link").getAttribute("href")).toBe("/muttizettel?event=event-16"); });
  it("does not offer the form for stored 18", () => { show(false); expect(screen.queryByRole("link")).toBeNull(); });
  it("does not offer the form for unknown age", () => { show(null); expect(screen.queryByRole("link")).toBeNull(); });
});