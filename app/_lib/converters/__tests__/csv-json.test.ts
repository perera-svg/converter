import { describe, expect, it } from "vitest";
import { convert } from "../csv-json";

describe("csv-json convert", () => {
  it("converts CSV with header to array of objects", () => {
    const input = "name,age\nAlice,30\nBob,25";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("all cell values are strings — no dynamic typing", () => {
    const input = "active,count\ntrue,42";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result[0].active).toBe("true");
    expect(result[0].count).toBe("42");
  });

  it("respects indent: 2", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: 2 });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, 2));
  });

  it("respects indent: 4", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: 4 });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, 4));
  });

  it("respects indent: tab", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: "\t" });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, "\t"));
  });

  it("skips empty lines", () => {
    const input = "name\nAlice\n\nBob\n";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result).toHaveLength(2);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("throws on malformed CSV and forwards papaparse error", () => {
    // Use an unterminated quote to guarantee a parse error:
    const input = 'name\n"unterminated';
    expect(() => convert(input, { indent: 2 })).toThrow();
  });
});
