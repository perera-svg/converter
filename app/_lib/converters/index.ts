import type { Format } from "../formats";
import type { ConvertOptions } from "./types";
import { convert as csvToJson } from "./csv-json";
import { convert as jsonToCsv } from "./json-csv";
import { convert as jsonToToml } from "./json-toml";
import { convert as jsonToXml } from "./json-xml";
import { convert as jsonToYaml } from "./json-yaml";
import { convert as tomlToJson } from "./toml-json";
import { convert as xmlToJson } from "./xml-json";
import { convert as yamlToJson } from "./yaml-json";

type ConverterFn = (input: string, options: ConvertOptions) => string;

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  "JSON→TOML": jsonToToml,
  "TOML→JSON": tomlToJson,
  "JSON→XML": jsonToXml,
  "XML→JSON": xmlToJson,
  "JSON→CSV": jsonToCsv,
  "CSV→JSON": csvToJson,
};

export function dispatch(
  from: Format,
  to: Format,
  input: string,
  options: ConvertOptions,
): string {
  const key = `${from}→${to}`;
  const fn = converters[key];
  if (!fn) throw new Error(`Unsupported conversion: ${key}`);
  return fn(input, options);
}
