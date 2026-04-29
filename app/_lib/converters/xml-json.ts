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
  const keys = Object.keys(parsed);

  if (keys.length === 0) {
    throw new Error("Input does not contain valid XML");
  }

  // With ignoreDeclaration: true, valid XML always produces exactly one key
  // (the root element). keys.length === 0 means the parser accepted non-XML
  // text silently — we catch that above. The else branch handles any other
  // edge case defensively.
  const data = keys.length === 1 ? parsed[keys[0]] : parsed;

  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(data, null, indent);
}
