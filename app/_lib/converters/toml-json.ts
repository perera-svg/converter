import { parse as tomlParse } from "smol-toml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = tomlParse(input);
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(parsed, null, indent);
}
