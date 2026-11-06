import { expect, it } from "vitest";
import { fetchAll } from "@/lib/fetchAll";
it("retains photos beyond 1000 rows", async () => {
  const photos = Array.from({ length: 1005 }, (_, id) => ({ id }));
  const result = await fetchAll(async (from, to) => ({ data: photos.slice(from, to + 1), error: null }));
  expect(result.length).toBe(1005);
  expect(result[1004].id).toBe(1004);
});