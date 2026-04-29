import Papa from "papaparse";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const result = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const fatalErrors = result.errors.filter((e) => e.type !== "Delimiter");
  if (fatalErrors.length > 0) throw new Error(fatalErrors[0].message);
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(result.data, null, indent);
}
