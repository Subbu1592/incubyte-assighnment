import { describe, expect, it } from "vitest";
import { addDays, isIsoDate, previousDay } from "./dates";

describe("dates", () => {
  it("rejects impossible calendar dates", () => {
    expect(isIsoDate("2026-02-31")).toBe(false);
    expect(isIsoDate("2026-10-13")).toBe(true);
  });

  it("steps across month boundaries in UTC", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2024-03-01")).toBe("2024-02-29");
    expect(addDays("2026-10-13", 366) > "2026-10-13").toBe(true);
  });
});
