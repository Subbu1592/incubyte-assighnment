"use client";

import * as Label from "@radix-ui/react-label";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CHANGE_REASONS, LEVELS, REASON_LABELS, currencies } from "../domain/reference";

export function SalaryForm({
  employeeId,
  currency,
  today,
  level,
}: {
  employeeId: number;
  currency: string;
  today: string;
  level: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setSaved(false);
    const response = await fetch(`/api/employees/${employeeId}/salary`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: String(data.get("amount") ?? ""),
        currency: String(data.get("currency") ?? ""),
        effectiveFrom: String(data.get("effectiveFrom") ?? ""),
        changeReason: String(data.get("changeReason") ?? ""),
        notes: String(data.get("notes") ?? ""),
        level: String(data.get("level") ?? ""),
      }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Could not save the salary.");
      return;
    }
    form.reset();
    setSaved(true);
    router.refresh();
  }

  return (
    <form className="panel padded form" onSubmit={onSubmit}>
      <h2>Record a pay change</h2>
      <p className="hint">The current salary stays in history and closes the day before this effective date.</p>
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="notice">Saved. The new amount is now current.</p> : null}
      <div className="field">
        <Label.Root htmlFor="amount">New annual salary</Label.Root>
        <input id="amount" name="amount" inputMode="decimal" required placeholder="120000.00" />
      </div>
      <div className="form-row">
        <label>
          Currency
          <select name="currency" defaultValue={currency}>
            {currencies().map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
        <label>
          Effective date
          <input name="effectiveFrom" type="date" required defaultValue={today} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Reason
          <select name="changeReason" defaultValue="merit" required>
            {CHANGE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select name="level" defaultValue="">
            <option value="">Keep {level}</option>
            {LEVELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field">
        <Label.Root htmlFor="notes">Notes</Label.Root>
        <textarea id="notes" name="notes" maxLength={280} placeholder="Optional context for the next HR manager" />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save salary"}
      </button>
    </form>
  );
}
