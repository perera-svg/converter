import Papa from "papaparse";
import type { ConvertOptions } from "./types";

export function convert(input: string, _options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error("CSV requires a top-level array");
  for (const item of parsed) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("CSV requires an array of objects");
    }
    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
      if (val !== null && typeof val === "object") {
        throw new Error(
          `CSV requires flat objects — nested values found at key \`${key}\``
        );
      }
    }
  }
  return Papa.unparse(parsed as Record<string, unknown>[], { newline: "\n" });
}
