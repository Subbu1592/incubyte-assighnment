import { describe, expect, it } from "vitest";
import { employeeQueryToSearch, likeContains, parseEmployeeQuery } from "./query";

describe("parseEmployeeQuery", () => {
  it("drops unknown filters and clamps the page size", () => {
    const query = parseEmployeeQuery(new URLSearchParams("country=ZZ&status=active&pageSize=500&sort=salary"));
    expect(query.country).toBeUndefined();
    expect(query.status).toBe("active");
    expect(query.pageSize).toBe(100);
    expect(query.sort).toBe("salary");
    expect(query.direction).toBe("desc");
  });

  it("round-trips the fields that differ from the defaults", () => {
    const query = parseEmployeeQuery(new URLSearchParams("q=ada&country=IN&page=2"));
    expect(employeeQueryToSearch(query)).toBe("?q=ada&country=IN&page=2");
  });
});

describe("likeContains", () => {
  it("escapes like wildcards", () => {
    expect(likeContains("100%_a")).toBe("%100\\%\\_a%");
  });
});
