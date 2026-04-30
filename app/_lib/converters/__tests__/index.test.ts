import { describe, expect, it } from "vitest";
import { dispatch } from "../index";

describe("dispatch", () => {
  it("routes JSON→YAML", () => {
    const result = dispatch("JSON", "YAML", JSON.stringify({ a: 1 }), {
      indent: 2,
    });
    expect(result).toBe("a: 1\n");
  });

  it("routes YAML→JSON", () => {
    const result = dispatch("YAML", "JSON", "a: 1\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("routes JSON→XML", () => {
    const result = dispatch("JSON", "XML", JSON.stringify({ a: 1 }), {
      indent: 2,
    });
    expect(result).toContain("<a>1</a>");
  });

  it("routes XML→JSON", () => {
    const result = dispatch("XML", "JSON", "<root><a>1</a></root>", {
      indent: 2,
    });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("routes JSON→TOML", () => {
    const result = dispatch("JSON", "TOML", JSON.stringify({ a: 1 }), { indent: 2 });
    expect(result).toContain("a = 1");
  });

  it("routes TOML→JSON", () => {
    const result = dispatch("TOML", "JSON", "a = 1\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("throws for unsupported pair", () => {
    expect(() => dispatch("XML", "CSV", "<a/>", { indent: 2 })).toThrow(
      "Unsupported conversion: XML→CSV",
    );
  });

  it("routes JSON→CSV", () => {
    const input = JSON.stringify([{ a: "1", b: "2" }]);
    const result = dispatch("JSON", "CSV", input, { indent: 2 });
    expect(result).toBe("a,b\n1,2");
  });

  it("routes CSV→JSON", () => {
    const result = dispatch("CSV", "JSON", "a,b\n1,2", { indent: 2 });
    expect(JSON.parse(result)).toEqual([{ a: "1", b: "2" }]);
  });
});
