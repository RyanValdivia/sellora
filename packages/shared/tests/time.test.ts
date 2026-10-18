import { describe, expect, it } from "vitest";
import { startOfDayInZone } from "../src/business/time.ts";

describe("startOfDayInZone", () => {
  it("Lima (UTC-5): las 02:00 UTC del 18 aún son el 17 en Lima", () => {
    expect(startOfDayInZone(new Date("2026-10-18T02:00:00Z"), "America/Lima").toISOString()).toBe(
      "2026-10-17T05:00:00.000Z",
    );
  });
  it("Lima: pasadas las 05:00 UTC ya es el día 18", () => {
    expect(startOfDayInZone(new Date("2026-10-18T05:00:01Z"), "America/Lima").toISOString()).toBe(
      "2026-10-18T05:00:00.000Z",
    );
  });
  it("UTC no cambia el día", () => {
    expect(startOfDayInZone(new Date("2026-10-18T23:59:59.999Z"), "UTC").toISOString()).toBe(
      "2026-10-18T00:00:00.000Z",
    );
  });
});
