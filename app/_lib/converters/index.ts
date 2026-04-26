import type { Format } from "../formats";
import type { ConvertOptions } from "./types";
import { convert as jsonToYaml } from "./json-yaml";
import { convert as yamlToJson } from "./yaml-json";

type ConverterFn = (input: string, options: ConvertOptions) => string;

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
};

export function dispatch(
  from: Format,
  to: Format,
  input: string,
  options: ConvertOptions
): string {
  const key = `${from}→${to}`;
  const fn = converters[key];
  if (!fn) throw new Error(`Unsupported conversion: ${key}`);
  return fn(input, options);
}
