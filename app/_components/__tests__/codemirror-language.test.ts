import { describe, expect, it } from "vitest";
import { getLanguageExtension } from "../codemirror-language";

describe("getLanguageExtension", () => {
  it("returns a defined extension for every supported format", () => {
    const formats = ["JSON", "YAML", "TOML", "XML", "CSV", "INI"] as const;
    for (const fmt of formats) {
      const ext = getLanguageExtension(fmt);
      expect(ext).toBeDefined();
    }
  });

  it("CSV returns an empty array (plain text, no grammar)", () => {
    const ext = getLanguageExtension("CSV");
    expect(Array.isArray(ext)).toBe(true);
    expect((ext as unknown[]).length).toBe(0);
  });

  it("non-CSV formats return a non-array extension object", () => {
    const formats = ["JSON", "YAML", "TOML", "XML", "INI"] as const;
    for (const fmt of formats) {
      const ext = getLanguageExtension(fmt);
      expect(Array.isArray(ext)).toBe(false);
    }
  });
});
