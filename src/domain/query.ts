import { COUNTRIES, DEPARTMENTS, LEVELS, STATUSES, type Department, type Level, type Status } from "./reference";

export const PAGE_SIZE = 25;
export const SORTS = ["name", "country", "department", "level", "hire_date", "salary"] as const;
export type SortKey = (typeof SORTS)[number];
export type Direction = "asc" | "desc";

export type EmployeeQuery = {
  q?: string;
  country?: string;
  department?: Department;
  level?: Level;
  status?: Status;
  page: number;
  pageSize: number;
  sort: SortKey;
  direction: Direction;
};

function one(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function isSort(value: string | undefined): value is SortKey {
  return SORTS.includes(value as SortKey);
}

export function parseEmployeeQuery(params: URLSearchParams): EmployeeQuery {
  const sortValue = one(params, "sort");
  const sort: SortKey = isSort(sortValue) ? sortValue : "name";
  const directionValue = one(params, "direction");
  const direction: Direction =
    directionValue === "asc" || directionValue === "desc" ? directionValue : sort === "salary" ? "desc" : "asc";

  const pageRaw = Number(one(params, "page") ?? 1);
  const pageSizeRaw = Number(one(params, "pageSize") ?? PAGE_SIZE);
  const country = one(params, "country");
  const department = one(params, "department");
  const level = one(params, "level");
  const status = one(params, "status");
  const q = one(params, "q");

  return {
    q: q ? q.slice(0, 80) : undefined,
    country: country && COUNTRIES.some((item) => item.code === country) ? country : undefined,
    department: department && DEPARTMENTS.includes(department as Department) ? (department as Department) : undefined,
    level: level && LEVELS.includes(level as Level) ? (level as Level) : undefined,
    status: status && STATUSES.includes(status as Status) ? (status as Status) : undefined,
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1,
    pageSize: Number.isFinite(pageSizeRaw) ? Math.min(100, Math.max(1, Math.floor(pageSizeRaw))) : PAGE_SIZE,
    sort,
    direction,
  };
}

export function parseCountry(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return COUNTRIES.some((country) => country.code === value) ? value : undefined;
}

export function employeeQueryToSearch(query: EmployeeQuery, patch: Partial<EmployeeQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.country) params.set("country", next.country);
  if (next.department) params.set("department", next.department);
  if (next.level) params.set("level", next.level);
  if (next.status) params.set("status", next.status);
  if (next.sort !== "name") params.set("sort", next.sort);
  const defaultDirection = next.sort === "salary" ? "desc" : "asc";
  if (next.direction !== defaultDirection) params.set("direction", next.direction);
  if (next.page !== 1) params.set("page", String(next.page));
  if (next.pageSize !== PAGE_SIZE) params.set("pageSize", String(next.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function likeContains(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function searchRecordToParams(search: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  return params;
}
