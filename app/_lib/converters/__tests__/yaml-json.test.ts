import { describe, expect, it } from "vitest";
import { convert } from "../yaml-json";

describe("yaml-json convert", () => {
  it("converts a flat YAML object", () => {
    const input = "name: my-app\nversion: 1.0.0\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "my-app", version: "1.0.0" });
  });

  it("converts nested YAML", () => {
    const input = "config:\n  port: 3000\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ config: { port: 3000 } });
  });

  it("converts YAML arrays", () => {
    const input = "tags:\n  - web\n  - api\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ tags: ["web", "api"] });
  });

  it("respects indent: 4", () => {
    const input = "config:\n  port: 3000\n";
    const result = convert(input, { indent: 4 });
    expect(result).toBe('{\n    "config": {\n        "port": 3000\n    }\n}');
  });

  it("respects indent: tab", () => {
    const input = "a: 1\n";
    const result = convert(input, { indent: "\t" });
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it("throws on invalid YAML", () => {
    expect(() => convert("{ invalid: yaml: here }", { indent: 2 })).toThrow();
  });

  it("throws on empty input after trim", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow(Error);
  });
});
