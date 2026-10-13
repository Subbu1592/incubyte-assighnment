import { describe, expect, it } from "vitest";
import { median, percentile, summarize } from "./stats";

describe("stats", () => {
  it("averages the two middle values for an even count", () => {
    expect(median([1, 2, 3, 4])).toBe(3);
    expect(median([10, 20, 30])).toBe(20);
  });

  it("uses nearest-rank percentiles", () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(sorted, 10)).toBe(1);
    expect(percentile(sorted, 90)).toBe(9);
    expect(percentile(sorted, 100)).toBe(10);
  });

  it("summarizes a band", () => {
    const summary = summarize([10, 30, 20]);
    expect(summary).toMatchObject({ count: 3, total: 60, min: 10, max: 30, mean: 20, median: 20 });
  });
});
