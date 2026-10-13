import { previousDay } from "./dates";
import {
  COUNTRIES,
  DEPARTMENT_WEIGHTS,
  DEPARTMENTS,
  FX_RATES,
  HISTORY_AS_OF,
  LEVEL_BANDS_USD,
  LEVEL_WEIGHTS,
  LEVELS,
  SEED,
  type Country,
  type Department,
  type Level,
} from "./reference";
import { jobTitle } from "./titles";

export type GeneratedEmployee = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  city: string;
  department: string;
  jobTitle: string;
  level: string;
  employmentType: string;
  status: string;
  hireDate: string;
};

export type GeneratedSalary = {
  employeeIndex: number;
  annualAmountMinor: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string;
  notes: string | null;
  createdAt: string;
};

const FIRST_NAMES = [
  "Aisha", "Arjun", "Mei", "Lucas", "Sofia", "Noah", "Priya", "Elena", "Omar", "Hannah",
  "Kenji", "Amelia", "Rohan", "Fatima", "Leo", "Chloe", "Diego", "Ananya", "Jonas", "Maya",
  "Hugo", "Leila", "Ethan", "Sara", "Nikhil", "Ines", "Owen", "Yara", "Felix", "Nora",
  "Kabir", "Iris", "Mateo", "Ava", "Sanjay", "Freya", "Adam", "Layla", "Theo", "Zara",
  "Hana", "Victor", "Nadia", "Samuel", "Amina", "Oscar", "Meera", "Elias", "Noor", "Caleb",
  "Andre", "Lina", "Hiro", "Clara", "Yusuf", "Emilia", "Ravi", "Isla", "Tomas", "Amira",
  "Nico", "Sana", "Ivan", "Grace", "Farid", "Lucia", "Dev", "Mara", "Jules", "Aya",
  "Patrick", "Rhea", "Emil", "Dina", "Pia", "Karim", "Nina", "Lewis", "Rosa", "Idris",
  "Tara", "Anton", "Willa", "Soren", "Mina", "Kian", "Esme", "Bruno", "Hala", "Nolan",
  "Diya", "Arman", "Cora", "Vijay", "Elise", "Rafael", "Bianca", "Kunal", "Petra", "Samir",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Garcia", "Muller", "Silva", "Khan", "Nguyen", "Cohen", "Rossi", "Andersen",
  "Ibrahim", "Kim", "Costa", "Nowak", "Dubois", "Singh", "Almeida", "Berg", "Chowdhury", "Fischer",
  "Hassan", "Ito", "Jensen", "Kaur", "Lopez", "Moreau", "Nair", "Okoye", "Petrov", "Quinn",
  "Reyes", "Sato", "Taylor", "Ueda", "Vogel", "Walsh", "Xu", "Young", "Zahir", "Brooks",
  "Ahmed", "Bennett", "Carter", "Das", "Edwards", "Fernandes", "Gupta", "Hoffman", "Iyer", "Johansson",
  "Kapoor", "Laurent", "Mensah", "Nakamura", "Osei", "Park", "Rahman", "Schmidt", "Thomas", "Usman",
  "Vasquez", "Wagner", "Xavier", "Yamamoto", "Zhou", "Abbott", "Bose", "Clark", "Diaz", "Engel",
  "Foster", "Ghosh", "Hansen", "Iqbal", "Joshi", "Keller", "Larsen", "Mehta", "Novak", "Owens",
  "Pereira", "Reddy", "Santos", "Traore", "Ullah", "Verma", "Weber", "Yadav", "Zimmerman", "Adebayo",
  "Becker", "Chaudhary", "Dutta", "Eriksson", "Fujita", "Graham", "Horvat", "Ivanov", "Kowalski", "Lindgren",
];

const HIRE_START = Date.UTC(2016, 0, 1);
const HIRE_END = Date.UTC(2026, 8, 1);

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends string>(rng: () => number, weights: Record<T, number>, keys: readonly T[]): T {
  const total = keys.reduce((sum, key) => sum + weights[key], 0);
  let cursor = rng() * total;
  for (const key of keys) {
    cursor -= weights[key];
    if (cursor <= 0) return key;
  }
  return keys[keys.length - 1];
}

function pickCountry(rng: () => number): Country {
  const total = COUNTRIES.reduce((sum, country) => sum + country.weight, 0);
  let cursor = rng() * total;
  for (const country of COUNTRIES) {
    cursor -= country.weight;
    if (cursor <= 0) return country;
  }
  return COUNTRIES[COUNTRIES.length - 1];
}

function localMinor(usdMajor: number, country: Country, factor: number): number {
  const usd = usdMajor * country.laborIndex * factor;
  const localMajor = usd / FX_RATES[country.currency];
  return Math.max(1, Math.round(localMajor * 100));
}

function bump(amountMinor: number, rng: () => number): number {
  const rate = 0.03 + rng() * 0.09;
  return Math.max(amountMinor + 1, Math.round(amountMinor * (1 + rate)));
}

export function generateWorkforce(count: number, seed = SEED): { employees: GeneratedEmployee[]; salaries: GeneratedSalary[] } {
  const rng = mulberry32(seed);
  const employees: GeneratedEmployee[] = [];
  const salaries: GeneratedSalary[] = [];

  for (let index = 0; index < count; index += 1) {
    const country = pickCountry(rng);
    const city = country.cities[Math.floor(rng() * country.cities.length)];
    const department = pickWeighted<Department>(rng, DEPARTMENT_WEIGHTS, DEPARTMENTS);
    const level = pickWeighted<Level>(rng, LEVEL_WEIGHTS, LEVELS);
    const typeRoll = rng();
    const employmentType = typeRoll < 0.92 ? "full_time" : typeRoll < 0.97 ? "contract" : "part_time";
    const statusRoll = rng();
    const status = statusRoll < 0.85 ? "active" : statusRoll < 0.9 ? "on_leave" : "terminated";
    const hireDate = new Date(HIRE_START + Math.floor(rng() * (HIRE_END - HIRE_START))).toISOString().slice(0, 10);
    const [bandMin, bandMax] = LEVEL_BANDS_USD[level];
    const usdMajor = bandMin + rng() * (bandMax - bandMin);
    const factor = employmentType === "part_time" ? 0.6 : 1;
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];

    const events: { from: string; amount: number; reason: string }[] = [
      { from: hireDate, amount: localMinor(usdMajor, country, factor), reason: "hire" },
    ];

    const firstReview = addYearsClamped(hireDate, 1);
    if (firstReview && rng() < 0.62) {
      const reasonRoll = rng();
      events.push({
        from: firstReview,
        amount: bump(events[events.length - 1].amount, rng),
        reason: reasonRoll < 0.8 ? "merit" : "market_adjustment",
      });
    }

    const secondReview = addYearsClamped(hireDate, 3);
    if (events.length > 1 && secondReview && secondReview > events[events.length - 1].from && rng() < 0.35) {
      events.push({
        from: secondReview,
        amount: bump(events[events.length - 1].amount, rng),
        reason: "merit",
      });
    }

    employees.push({
      employeeCode: `ACME-${String(index + 1).padStart(5, "0")}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${index + 1}@acme.example`.toLowerCase(),
      countryCode: country.code,
      city,
      department,
      jobTitle: jobTitle(department, level),
      level,
      employmentType,
      status,
      hireDate,
    });

    events.forEach((event, eventIndex) => {
      const next = events[eventIndex + 1];
      salaries.push({
        employeeIndex: index,
        annualAmountMinor: event.amount,
        currency: country.currency,
        effectiveFrom: event.from,
        effectiveTo: next ? previousDay(next.from) : null,
        changeReason: event.reason,
        notes: null,
        createdAt: `${event.from}T00:00:00.000Z`,
      });
    });
  }

  return { employees, salaries };
}

function addYearsClamped(iso: string, years: number): string | null {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year + years, month - 1, day));
  const next = date.toISOString().slice(0, 10);
  return next <= HISTORY_AS_OF ? next : null;
}
