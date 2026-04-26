import { describe, expect, it } from "vitest";
import { dispatch } from "../index";

describe("dispatch", () => {
  it("routes JSON→YAML", () => {
    const result = dispatch("JSON", "YAML", JSON.stringify({ a: 1 }), { indent: 2 });
    expect(result).toBe("a: 1\n");
  });

  it("routes YAML→JSON", () => {
    const result = dispatch("YAML", "JSON", "a: 1\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("throws for unsupported pair", () => {
    expect(() => dispatch("JSON", "TOML", "{}", { indent: 2 })).toThrow(
      "Unsupported conversion: JSON→TOML"
    );
  });
});
