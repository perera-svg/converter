import { describe, expect, it } from "vitest";
import { convert } from "../toml-json";

describe("toml-json", () => {
  it("converts flat key/value to object", () => {
    const result = convert('name = "app"\nversion = "1.0"\n', { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "app", version: "1.0" });
  });

  it("converts [section] to nested object", () => {
    const result = convert("[db]\nhost = \"localhost\"\nport = 5432\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ db: { host: "localhost", port: 5432 } });
  });

  it("converts [[items]] to array of objects", () => {
    const toml = "[[items]]\nid = 1\n\n[[items]]\nid = 2\n";
    const result = convert(toml, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ items: [{ id: 1 }, { id: 2 }] });
  });

  it("converts inline array to JS array", () => {
    const result = convert("tags = [\"web\", \"api\"]\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ tags: ["web", "api"] });
  });

  it("preserves mixed types", () => {
    const toml = 'name = "x"\ncount = 3\nenabled = true\n';
    const result = convert(toml, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "x", count: 3, enabled: true });
  });

  it("renders TOML datetime as ISO 8601 string", () => {
    const toml = "ts = 1979-05-27T07:32:00Z\n";
    const result = convert(toml, { indent: 2 });
    const parsed = JSON.parse(result);
    expect(typeof parsed.ts).toBe("string");
    expect(parsed.ts).toMatch(/1979-05-27/);
  });

  it("respects indent: 2", () => {
    const result = convert("[a]\nb = 1\n", { indent: 2 });
    expect(result).toBe('{\n  "a": {\n    "b": 1\n  }\n}');
  });

  it("respects indent: 4", () => {
    const result = convert("[a]\nb = 1\n", { indent: 4 });
    expect(result).toBe('{\n    "a": {\n        "b": 1\n    }\n}');
  });

  it("respects indent: tab", () => {
    const result = convert("[a]\nb = 1\n", { indent: "\t" });
    expect(result).toBe('{\n\t"a": {\n\t\t"b": 1\n\t}\n}');
  });

  it("throws on invalid TOML", () => {
    expect(() => convert("this is not toml ===", { indent: 2 })).toThrow();
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });
});
