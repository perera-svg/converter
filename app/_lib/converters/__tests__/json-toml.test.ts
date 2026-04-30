import { parse as tomlParse } from "smol-toml";
import { describe, expect, it } from "vitest";
import { convert } from "../json-toml";

const opts = { indent: 2 };

describe("json-toml", () => {
  it("converts a flat object", () => {
    const result = convert(JSON.stringify({ name: "app", version: "1.0" }), opts);
    const parsed = tomlParse(result);
    expect(parsed).toEqual({ name: "app", version: "1.0" });
  });

  it("converts a nested object to [section] headers", () => {
    const result = convert(JSON.stringify({ db: { host: "localhost", port: 5432 } }), opts);
    const parsed = tomlParse(result);
    expect(parsed).toEqual({ db: { host: "localhost", port: 5432 } });
  });

  it("converts an array of primitives to inline array", () => {
    const result = convert(JSON.stringify({ tags: ["web", "api"] }), opts);
    const parsed = tomlParse(result);
    expect(parsed).toEqual({ tags: ["web", "api"] });
  });

  it("converts an array of objects to [[items]]", () => {
    const input = JSON.stringify({ items: [{ id: 1 }, { id: 2 }] });
    const result = convert(input, opts);
    const parsed = tomlParse(result);
    expect(parsed).toEqual({ items: [{ id: 1 }, { id: 2 }] });
  });

  it("handles mixed types (string, number, boolean)", () => {
    const obj = { name: "x", count: 3, enabled: true };
    const result = convert(JSON.stringify(obj), opts);
    const parsed = tomlParse(result);
    expect(parsed).toEqual(obj);
  });

  it("rejects a top-level array", () => {
    expect(() => convert(JSON.stringify([1, 2, 3]), opts)).toThrow(
      "TOML requires an object at the top level",
    );
  });

  it("rejects a top-level scalar", () => {
    expect(() => convert(JSON.stringify(42), opts)).toThrow(
      "TOML requires an object at the top level",
    );
  });

  it("rejects a top-level null", () => {
    expect(() => convert(JSON.stringify(null), opts)).toThrow(
      "TOML requires an object at the top level",
    );
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", opts)).toThrow(SyntaxError);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", opts)).toThrow("Input is empty");
  });

  it("ignores the indent option (output identical for 2, 4, tab)", () => {
    const input = JSON.stringify({ a: 1 });
    const r2 = convert(input, { indent: 2 });
    const r4 = convert(input, { indent: 4 });
    const rt = convert(input, { indent: "\t" });
    expect(r2).toBe(r4);
    expect(r2).toBe(rt);
  });
});
