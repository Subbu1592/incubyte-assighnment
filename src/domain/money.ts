const MAJOR = /^\d+(\.\d{1,2})?$/;

/** Parse a major-unit amount such as "120000" or "120000.50" into minor units. */
export function parseMajorToMinor(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!MAJOR.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  if (whole.length > 12) return null;
  const minor = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  return minor;
}

export function toUsdMinor(localMinor: number, usdPerUnit: number): number {
  if (!Number.isFinite(usdPerUnit) || usdPerUnit <= 0) {
    throw new Error("FX rate must be a positive number");
  }
  return Math.round(localMinor * usdPerUnit);
}

export function formatMoney(minor: number, currency: string, digits: 0 | 2 = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 100);
}

export function formatCompact(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minor / 100);
}
