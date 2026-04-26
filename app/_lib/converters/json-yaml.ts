import * as yaml from "yaml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = JSON.parse(input);
  const indent = typeof options.indent === "string" ? 2 : options.indent;
  return yaml.stringify(parsed, { indent });
}
