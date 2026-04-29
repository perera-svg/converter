import { XMLBuilder } from "fast-xml-parser";
import type { ConvertOptions } from "./types";

const XML_NAME_RE = /^(?!xml)[A-Za-z_][A-Za-z0-9._-]*$/i;

function validateKeys(node: unknown): void {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(validateKeys);
    return;
  }
  for (const key of Object.keys(node as Record<string, unknown>)) {
    if (!XML_NAME_RE.test(key)) {
      throw new Error(`Invalid XML element name in JSON key: "${key}"`);
    }
    validateKeys((node as Record<string, unknown>)[key]);
  }
}

function nullsToEmpty(node: unknown): unknown {
  if (node === null) return "";
  if (Array.isArray(node)) return node.map(nullsToEmpty);
  if (typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>).map(([k, v]) => [
        k,
        nullsToEmpty(v),
      ]),
    );
  }
  return node;
}

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = JSON.parse(input);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("XML requires an object at the top level");
  }
  validateKeys(parsed);

  const indentBy =
    options.indent === "\t" ? "  " : " ".repeat(Number(options.indent));

  const builder = new XMLBuilder({
    format: true,
    indentBy,
    suppressEmptyNode: false,
  });

  const processed = nullsToEmpty(parsed) as Record<string, unknown>;
  const xml = builder.build({ root: processed }) as string;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}
