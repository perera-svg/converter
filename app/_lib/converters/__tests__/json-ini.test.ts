import { describe, expect, it } from "vitest";
import { convert } from "../json-ini";

const opts = { indent: 2 };

describe("json-ini", () => {
  it("converts a flat object to key=value pairs", () => {
    const result = convert(JSON.stringify({ name: "app", version: "1.0" }), opts);
    expect(result).toContain("name");
    expect(result).toContain("app");
    expect(result).toContain("version");
    expect(result).toContain("1.0");
  });

  it("converts a one-level nested object to a [section] block", () => {
    const result = convert(JSON.stringify({ db: { host: "localhost", port: 3306 } }), opts);
    expect(result).toContain("[db]");
    expect(result).toContain("host");
    expect(result).toContain("localhost");
    expect(result).toContain("port");
    expect(result).toContain("3306");
  });

  it("handles mixed top-level scalars and sections", () => {
    const result = convert(JSON.stringify({ name: "app", db: { host: "localhost" } }), opts);
    expect(result).toContain("name");
    expect(result).toContain("app");
    expect(result).toContain("[db]");
    expect(result).toContain("host");
  });

  it("throws on empty input", () => {
    expect(() => convert("", opts)).toThrow("Input is empty");
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", opts)).toThrow("Input is empty");
  });

  it("throws on top-level array", () => {
    expect(() => convert(JSON.stringify([1, 2]), opts)).toThrow(
      "INI requires an object at the top level",
    );
  });

  it("throws on top-level null", () => {
    expect(() => convert(JSON.stringify(null), opts)).toThrow(
      "INI requires an object at the top level",
    );
  });

  it("throws on top-level scalar", () => {
    expect(() => convert(JSON.stringify(42), opts)).toThrow(
      "INI requires an object at the top level",
    );
  });

  it("throws on array as a value", () => {
    expect(() => convert(JSON.stringify({ tags: ["a", "b"] }), opts)).toThrow(
      'INI does not support arrays — found at key "tags"',
    );
  });

  it("throws on array inside a section", () => {
    expect(() => convert(JSON.stringify({ db: { hosts: ["a", "b"] } }), opts)).toThrow(
      'INI does not support arrays — found at key "db.hosts"',
    );
  });

  it("throws on object nested more than one level deep", () => {
    expect(() =>
      convert(JSON.stringify({ config: { database: { host: "localhost" } } }), opts),
    ).toThrow('INI supports one level of nesting — found nested object at "config.database"');
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", opts)).toThrow(SyntaxError);
  });
});
