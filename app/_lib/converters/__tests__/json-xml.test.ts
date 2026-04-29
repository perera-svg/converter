import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { convert } from "../json-xml";

// Use the same parser config as xml-json.ts to verify round-trips
const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: true,
  trimValues: true,
  ignoreDeclaration: true,
});

describe("json-xml convert", () => {
  it("includes the XML declaration", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: 2 });
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("converts a flat object", () => {
    const result = convert(
      JSON.stringify({ name: "my-app", version: "1.0.0" }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { name: "my-app", version: "1.0.0" },
    });
  });

  it("converts a nested object", () => {
    const result = convert(
      JSON.stringify({ config: { port: 3000, host: "localhost" } }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { config: { port: 3000, host: "localhost" } },
    });
  });

  it("converts an array of primitives as repeated tags (Option A)", () => {
    const result = convert(JSON.stringify({ tags: ["web", "api"] }), {
      indent: 2,
    });
    expect(parser.parse(result)).toEqual({ root: { tags: ["web", "api"] } });
  });

  it("converts an array of objects as repeated tags", () => {
    const result = convert(
      JSON.stringify({ items: [{ name: "foo" }, { name: "bar" }] }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { items: [{ name: "foo" }, { name: "bar" }] },
    });
  });

  it("converts null value to empty element", () => {
    const result = convert(JSON.stringify({ foo: null }), { indent: 2 });
    // Empty element parses back to empty string (lossy — documented)
    const parsed = parser.parse(result) as { root: { foo: string } };
    expect(parsed.root.foo).toBe("");
  });

  it("rejects a top-level array", () => {
    expect(() => convert("[1,2,3]", { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a top-level scalar", () => {
    expect(() => convert('"hello"', { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a top-level null", () => {
    expect(() => convert("null", { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a key starting with a digit", () => {
    expect(() => convert('{"123abc":"x"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "123abc"',
    );
  });

  it("rejects a key containing a space", () => {
    expect(() => convert('{"key with space":"x"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "key with space"',
    );
  });

  it("rejects a key starting with @", () => {
    expect(() => convert('{"@id":"1"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "@id"',
    );
  });

  it("rejects a key starting with xml (XML reserved prefix)", () => {
    expect(() => convert('{"xmlFoo":"bar"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "xmlFoo"',
    );
  });

  it("rejects an invalid key nested inside an array of objects", () => {
    expect(() =>
      convert(JSON.stringify({ items: [{ "bad key": 1 }] }), { indent: 2 }),
    ).toThrow('Invalid XML element name in JSON key: "bad key"');
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("honors indent: 4", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: 4 });
    // 4-space indent inside <root>
    expect(result).toContain("    <a>1</a>");
  });

  it("uses 2-space fallback for tab indent (XML has no tab-indent concept)", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: "\t" });
    expect(result).toContain("  <a>1</a>");
    expect(result).not.toContain("\t<a>");
  });
});
