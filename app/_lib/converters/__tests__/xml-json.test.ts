import { describe, expect, it } from "vitest";
import { convert } from "../xml-json";

describe("xml-json convert", () => {
  it("converts a flat XML document (with declaration) to JSON", () => {
    const input = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<root>",
      "  <name>my-app</name>",
      "  <version>1.0.0</version>",
      "</root>",
    ].join("\n");
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "my-app", version: "1.0.0" });
  });

  it("converts a flat XML document (without declaration) to JSON", () => {
    const result = convert("<root><name>my-app</name></root>", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "my-app" });
  });

  it("converts nested elements to a nested object", () => {
    const result = convert("<root><config><port>3000</port></config></root>", {
      indent: 2,
    });
    expect(JSON.parse(result)).toEqual({ config: { port: 3000 } });
  });

  it("converts repeated same-named siblings to an array", () => {
    const result = convert("<root><tags>web</tags><tags>api</tags></root>", {
      indent: 2,
    });
    expect(JSON.parse(result)).toEqual({ tags: ["web", "api"] });
  });

  it("converts repeated object siblings to an array of objects", () => {
    const result = convert(
      "<root><item><name>foo</name></item><item><name>bar</name></item></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({
      item: [{ name: "foo" }, { name: "bar" }],
    });
  });

  it("coerces numeric text content to number", () => {
    const result = convert("<root><port>3000</port></root>", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ port: 3000 });
  });

  it("coerces boolean text content to boolean", () => {
    const result = convert(
      "<root><debug>true</debug><verbose>false</verbose></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ debug: true, verbose: false });
  });

  it("drops XML attributes (documented lossy direction)", () => {
    const result = convert('<root><foo id="1">bar</foo></root>', { indent: 2 });
    expect(JSON.parse(result)).toEqual({ foo: "bar" });
  });

  it("unwraps the single root element", () => {
    // <root> wrapper from JSON→XML is removed so round-trips are clean
    const result = convert("<root><a>1</a></root>", { indent: 2 });
    const parsed = JSON.parse(result);
    expect(parsed).not.toHaveProperty("root");
    expect(parsed).toHaveProperty("a", 1);
  });

  it("respects indent: 2", () => {
    const result = convert("<root><a>1</a></root>", { indent: 2 });
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("respects indent: 4", () => {
    const result = convert("<root><a>1</a></root>", { indent: 4 });
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it("respects indent: tab", () => {
    const result = convert("<root><a>1</a></root>", { indent: "\t" });
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it("throws on malformed XML", () => {
    // A single < that doesn't form a valid tag is unparseable
    expect(() => convert("<", { indent: 2 })).toThrow();
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });
});
