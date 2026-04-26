import * as yaml from "yaml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = yaml.parse(input) as unknown;
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(parsed, null, indent);
}
