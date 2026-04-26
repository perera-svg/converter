import * as yaml from "yaml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = JSON.parse(input);
  // YAML spec forbids tab indentation; fall back to 2 spaces
  const indent = typeof options.indent === "string" ? 2 : options.indent;
  return yaml.stringify(parsed, { indent });
}
