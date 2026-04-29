import { XMLParser } from "fast-xml-parser";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
    ignoreDeclaration: true,
  });

  const parsed = parser.parse(input) as Record<string, unknown>;

  // Unwrap the single top-level element to keep round-trips clean.
  // Any valid XML has exactly one root element, so keys.length === 1
  // is the normal path. The else branch is a defensive fallback.
  const keys = Object.keys(parsed);
  const data = keys.length === 1 ? parsed[keys[0]] : parsed;

  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(data, null, indent);
}
