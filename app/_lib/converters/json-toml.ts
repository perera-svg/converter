import { stringify as tomlStringify } from "smol-toml";
import type { ConvertOptions } from "./types";

export function convert(input: string, _options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = JSON.parse(input);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("TOML requires an object at the top level");
  }
  return tomlStringify(parsed as Record<string, unknown>);
}
