export type Summary = {
  count: number;
  total: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
};

export function median(sorted: number[]): number {
  if (sorted.length === 0) throw new Error("median of empty list");
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Nearest-rank percentile. `sorted` must be ascending. `p` is 0–100. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) throw new Error("percentile of empty list");
  if (p <= 0) return sorted[0];
  if (p >= 100) return sorted[sorted.length - 1];
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[rank - 1];
}

export function summarize(values: number[]): Summary {
  if (values.length === 0) throw new Error("summary of empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    count: sorted.length,
    total,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(total / sorted.length),
    median: median(sorted),
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
  };
}
