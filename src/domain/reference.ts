export const SEED = 20261013;
export const HISTORY_AS_OF = "2026-10-13";
export const FX_AS_OF = "2026-10-01";

export type Country = {
  code: string;
  name: string;
  currency: string;
  laborIndex: number;
  weight: number;
  cities: string[];
};

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", currency: "USD", laborIndex: 1, weight: 22, cities: ["Austin", "New York", "Seattle"] },
  { code: "IN", name: "India", currency: "INR", laborIndex: 0.28, weight: 30, cities: ["Bengaluru", "Pune", "Hyderabad"] },
  { code: "GB", name: "United Kingdom", currency: "GBP", laborIndex: 0.96, weight: 8, cities: ["London", "Manchester"] },
  { code: "DE", name: "Germany", currency: "EUR", laborIndex: 0.9, weight: 8, cities: ["Berlin", "Munich"] },
  { code: "NL", name: "Netherlands", currency: "EUR", laborIndex: 0.88, weight: 5, cities: ["Amsterdam"] },
  { code: "SG", name: "Singapore", currency: "SGD", laborIndex: 1.02, weight: 6, cities: ["Singapore"] },
  { code: "AE", name: "United Arab Emirates", currency: "AED", laborIndex: 0.86, weight: 5, cities: ["Dubai"] },
  { code: "CA", name: "Canada", currency: "CAD", laborIndex: 0.9, weight: 6, cities: ["Toronto", "Vancouver"] },
  { code: "AU", name: "Australia", currency: "AUD", laborIndex: 0.94, weight: 5, cities: ["Sydney", "Melbourne"] },
  { code: "BR", name: "Brazil", currency: "BRL", laborIndex: 0.36, weight: 5, cities: ["Sao Paulo", "Florianopolis"] },
];

/** USD received for one major unit of the currency. Assessment card, not a live feed. */
export const FX_RATES: Record<string, number> = {
  USD: 1,
  INR: 0.012,
  GBP: 1.27,
  EUR: 1.09,
  SGD: 0.75,
  AED: 0.2723,
  CAD: 0.74,
  AUD: 0.67,
  BRL: 0.19,
};

export const LEVELS = ["IC1", "IC2", "IC3", "IC4", "IC5", "IC6", "M1", "M2", "M3"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_WEIGHTS: Record<Level, number> = {
  IC1: 8,
  IC2: 15,
  IC3: 22,
  IC4: 18,
  IC5: 10,
  IC6: 5,
  M1: 12,
  M2: 7,
  M3: 3,
};

/** US reference annual salary band, in major USD. */
export const LEVEL_BANDS_USD: Record<Level, [number, number]> = {
  IC1: [48000, 68000],
  IC2: [68000, 92000],
  IC3: [92000, 128000],
  IC4: [128000, 168000],
  IC5: [168000, 215000],
  IC6: [215000, 280000],
  M1: [145000, 195000],
  M2: [185000, 255000],
  M3: [240000, 340000],
};

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "People",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Customer Success",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_WEIGHTS: Record<Department, number> = {
  Engineering: 24,
  Product: 8,
  Design: 6,
  Data: 8,
  People: 5,
  Finance: 6,
  Sales: 14,
  Marketing: 8,
  Operations: 11,
  "Customer Success": 10,
};

export const CHANGE_REASONS = [
  "merit",
  "promotion",
  "market_adjustment",
  "correction",
  "relocation",
  "role_change",
] as const;
export type ChangeReason = (typeof CHANGE_REASONS)[number];

export const REASON_LABELS: Record<string, string> = {
  hire: "Hire",
  merit: "Merit",
  promotion: "Promotion",
  market_adjustment: "Market adjustment",
  correction: "Correction",
  relocation: "Relocation",
  role_change: "Role change",
};

export const STATUSES = ["active", "on_leave", "terminated"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
};

export const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
};

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

export function currencies(): string[] {
  return Object.keys(FX_RATES);
}
