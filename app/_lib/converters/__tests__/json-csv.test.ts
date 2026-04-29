import { describe, expect, it } from "vitest";
import { convert } from "../json-csv";

describe("json-csv convert", () => {
  it("converts a flat array of objects to CSV with header row", () => {
    const input = JSON.stringify([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("handles a single-column array", () => {
    const input = JSON.stringify([{ id: "1" }, { id: "2" }]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("id\n1\n2");
  });

  it("stringifies mixed primitive values (number, boolean) into CSV cells", () => {
    const input = JSON.stringify([{ active: true, count: 42, label: "x" }]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("active,count,label\ntrue,42,x");
  });

  it("produces identical output regardless of indent option", () => {
    const input = JSON.stringify([{ a: "1" }]);
    const r2 = convert(input, { indent: 2 });
    const r4 = convert(input, { indent: 4 });
    const rt = convert(input, { indent: "\t" });
    expect(r2).toBe(r4);
    expect(r2).toBe(rt);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws when top level is an object (not array)", () => {
    expect(() => convert(JSON.stringify({ a: 1 }), { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when top level is null", () => {
    expect(() => convert("null", { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when top level is a scalar", () => {
    expect(() => convert("42", { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when array contains non-objects (strings)", () => {
    expect(() => convert(JSON.stringify(["a", "b"]), { indent: 2 })).toThrow(
      "CSV requires an array of objects"
    );
  });

  it("throws when array contains nested objects and names the key", () => {
    const input = JSON.stringify([{ name: "Alice", config: { port: 3000 } }]);
    expect(() => convert(input, { indent: 2 })).toThrow(
      "CSV requires flat objects — nested values found at key `config`"
    );
  });

  it("throws when array contains nested arrays and names the key", () => {
    const input = JSON.stringify([{ name: "Alice", tags: ["a", "b"] }]);
    expect(() => convert(input, { indent: 2 })).toThrow(
      "CSV requires flat objects — nested values found at key `tags`"
    );
  });
});
