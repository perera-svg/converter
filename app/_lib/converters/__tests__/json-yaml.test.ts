import { describe, expect, it } from "vitest";
import { convert } from "../json-yaml";

describe("json-yaml convert", () => {
  it("converts a flat object", () => {
    const input = JSON.stringify({ name: "my-app", version: "1.0.0" });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("name: my-app\nversion: 1.0.0\n");
  });

  it("converts a nested object", () => {
    const input = JSON.stringify({ config: { port: 3000 } });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("config:\n  port: 3000\n");
  });

  it("converts arrays", () => {
    const input = JSON.stringify({ tags: ["web", "api"] });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("tags:\n  - web\n  - api\n");
  });

  it("respects indent: 4", () => {
    const input = JSON.stringify({ config: { port: 3000 } });
    const result = convert(input, { indent: 4 });
    expect(result).toBe("config:\n    port: 3000\n");
  });

  it("falls back to indent 2 when given a tab string", () => {
    const input = JSON.stringify({ a: 1 });
    const tabResult = convert(input, { indent: "\t" });
    const defaultResult = convert(input, { indent: 2 });
    expect(tabResult).toBe(defaultResult);
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws on empty input after trim", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow();
  });
});
