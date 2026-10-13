import { CHANGE_REASONS, LEVELS, type ChangeReason, type Level } from "./reference";
import { addDays, isIsoDate } from "./dates";
import { parseMajorToMinor } from "./money";

const MAX_FUTURE_DAYS = 366;
const MAX_NOTE = 280;

export type OpenSalary = {
  id: number;
  annualAmountMinor: number;
  currency: string;
  effectiveFrom: string;
};

export type SalaryChangeRequest = {
  annualAmountMinor: number;
  currency: string;
  effectiveFrom: string;
  changeReason: ChangeReason;
  notes: string | null;
  level: Level | null;
};

export type PlannedSalaryChange = {
  close: { id: number; effectiveTo: string };
  insert: {
    annualAmountMinor: number;
    currency: string;
    effectiveFrom: string;
    changeReason: ChangeReason;
    notes: string | null;
  };
  level: Level | null;
};

type PlanResult = { ok: true; plan: PlannedSalaryChange } | { ok: false; error: string };

export function planSalaryChange(input: {
  employeeStatus: string;
  current: OpenSalary;
  next: SalaryChangeRequest;
  today: string;
  knownCurrencies: readonly string[];
}): PlanResult {
  if (input.employeeStatus === "terminated") {
    return { ok: false, error: "Terminated employees cannot have a new salary. Rehire them first." };
  }
  if (!input.knownCurrencies.includes(input.next.currency)) {
    return { ok: false, error: "Choose a currency from the rate card." };
  }
  if (!isIsoDate(input.next.effectiveFrom) || !isIsoDate(input.today)) {
    return { ok: false, error: "Effective date must be a real calendar date." };
  }
  if (input.next.effectiveFrom <= input.current.effectiveFrom) {
    return {
      ok: false,
      error: `Effective date must be after the current salary date (${input.current.effectiveFrom}).`,
    };
  }
  if (input.next.effectiveFrom > addDays(input.today, MAX_FUTURE_DAYS)) {
    return { ok: false, error: "Effective date cannot be more than a year out." };
  }
  if (!Number.isInteger(input.next.annualAmountMinor) || input.next.annualAmountMinor <= 0) {
    return { ok: false, error: "Salary must be a positive amount." };
  }
  if (input.next.notes && input.next.notes.length > MAX_NOTE) {
    return { ok: false, error: `Notes must be ${MAX_NOTE} characters or fewer.` };
  }

  return {
    ok: true,
    plan: {
      close: { id: input.current.id, effectiveTo: addDays(input.next.effectiveFrom, -1) },
      insert: {
        annualAmountMinor: input.next.annualAmountMinor,
        currency: input.next.currency,
        effectiveFrom: input.next.effectiveFrom,
        changeReason: input.next.changeReason,
        notes: input.next.notes,
      },
      level: input.next.level,
    },
  };
}

export function parseSalaryRequest(body: unknown): { ok: true; value: SalaryChangeRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Missing salary details." };
  const record = body as Record<string, unknown>;
  const amount = parseMajorToMinor(String(record.amount ?? ""));
  if (amount === null) return { ok: false, error: "Enter an annual amount with at most two decimal places." };

  const currency = String(record.currency ?? "").trim().toUpperCase();
  const effectiveFrom = String(record.effectiveFrom ?? "").trim();
  const changeReason = String(record.changeReason ?? "").trim();
  if (!CHANGE_REASONS.includes(changeReason as ChangeReason)) {
    return { ok: false, error: "Choose a reason for the change." };
  }

  const notesRaw = String(record.notes ?? "").trim();
  const levelRaw = String(record.level ?? "").trim();
  if (levelRaw && !LEVELS.includes(levelRaw as Level)) {
    return { ok: false, error: "Choose a valid level." };
  }

  return {
    ok: true,
    value: {
      annualAmountMinor: amount,
      currency,
      effectiveFrom,
      changeReason: changeReason as ChangeReason,
      notes: notesRaw ? notesRaw : null,
      level: levelRaw ? (levelRaw as Level) : null,
    },
  };
}
