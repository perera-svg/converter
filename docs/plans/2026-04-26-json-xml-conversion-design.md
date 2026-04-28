# JSON ↔ XML Conversion — Design

**Date:** 2026-04-26
**Status:** Approved
**Scope:** JSON → XML and XML → JSON, client-side, using the `fast-xml-parser` npm package

---

## Problem

The converter dispatch table in `app/_lib/converters/index.ts` does not route `JSON↔XML`. The `[from]/[to]` route statically generates `/json/xml` and `/xml/json` pages, and the UI renders fully — but any conversion attempt for those pairs throws `Unsupported conversion: JSON→XML`. We need to add real conversion logic for both XML directions.

---

## Decisions

- **Both directions:** JSON → XML and XML → JSON. The SWAP button assumes the reverse pair works, and the JSON↔TOML design established this symmetry as a project convention.
- **Library:** `fast-xml-parser` — both directions, ~30 kB gzipped, browser-safe, well-maintained (5M+ weekly downloads). Throws on malformed XML with line info. Defaults already match the chosen array convention.
- **Architecture:** Per-direction converter modules, mirroring the existing JSON↔YAML and JSON↔TOML pattern. No premature abstraction.
- **Array mapping (Option A — repeated tags):** `{"tags": ["web","api"]}` → `<tags>web</tags><tags>api</tags>`. Matches XML's natural "repeated element" idiom and what most JSON↔XML tools do. Round-trip uses `fast-xml-parser`'s built-in heuristic: multiple same-named siblings become an array.
- **Root element:** Fixed `<root>` for JSON → XML. Predictable, no UI churn. XML → JSON unwraps the single top-level element so round-trips are clean.
- **XML declaration:** Always emit `<?xml version="1.0" encoding="UTF-8"?>` at the top of JSON → XML output. Standard XML; what most JSON↔XML tools emit.
- **Top-level type:** JSON → XML rejects non-object roots (`null`, scalars, arrays) with a clear error. XML always has a single root, but auto-wrapping invents structure. Mirrors the TOML design's stance.
- **Invalid XML element names:** JSON keys that aren't valid XML names (start with digit, contain spaces, special chars) cause a throw with the offending key in the message. Honest; users can fix their JSON. Sanitizing silently is lossy and surprises the round-trip.
- **`null` handling:** Rendered as empty element `<foo></foo>`. Documented lossy direction (XML → JSON returns `""`, not `null`). Avoids needing the `xsi` namespace.
- **Type coercion (XML → JSON):** Enabled (`parseTagValue: true`). `<port>3000</port>` becomes `3000`, not `"3000"`. Standard behavior.
- **Attributes:** Dropped on XML → JSON (`ignoreAttributes: true`), and never emitted on JSON → XML. Documented lossy.
- **Indent option:** Honored in both directions. XML → JSON passes `options.indent` straight to `JSON.stringify`. JSON → XML maps tab to 2-space fallback (matches the YAML pattern).

---

## File Structure

```
app/_lib/converters/
  index.ts              (existing — extend dispatch map)
  json-yaml.ts          (existing — unchanged)
  yaml-json.ts          (existing — unchanged)
  json-xml.ts           (NEW)
  xml-json.ts           (NEW)
  types.ts              (existing — unchanged)
  __tests__/
    index.test.ts       (existing — extend)
    json-yaml.test.ts   (existing — unchanged)
    yaml-json.test.ts   (existing — unchanged)
    json-xml.test.ts    (NEW)
    xml-json.test.ts    (NEW)
```

---

## Converter Modules

Each module exports a single `convert(input, options)` function with the established signature:

```ts
type ConvertOptions = { indent: number | string }
```

### `json-xml.ts`

```ts
import { XMLBuilder } from "fast-xml-parser";
import type { ConvertOptions } from "./types";

const XML_NAME_RE = /^[A-Za-z_][A-Za-z0-9._-]*$/;

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

  return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build({ root: parsed })}`;
}
```

- `JSON.parse` throws `SyntaxError` on invalid JSON.
- Top-level guard rejects `null`, scalars, and arrays.
- `validateKeys` walks the parsed value once and throws on any invalid element name.
- Tab indent maps to 2 spaces because `fast-xml-parser` accepts a fixed indent string per call.
- Output is wrapped in `{ root: parsed }` so the top-level `<root>` element is always emitted.

### `xml-json.ts`

```ts
import { XMLParser } from "fast-xml-parser";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
  });

  const parsed = parser.parse(input) as Record<string, unknown>;

  // Unwrap the single top-level element to keep round-trips clean
  // (JSON→XML always wraps in <root>, so XML→JSON should mirror).
  const keys = Object.keys(parsed);
  const data = keys.length === 1 ? parsed[keys[0]] : parsed;

  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(data, null, indent);
}
```

- `fast-xml-parser` throws `Error` on malformed XML; the message bubbles up to the existing status strip.
- `parseTagValue: true` coerces numeric and boolean text content.
- `ignoreAttributes: true` drops attributes (documented lossy direction).
- The `<?xml ... ?>` declaration is parsed but not emitted as a JSON key by default.
- Single-root unwrap: any valid XML has exactly one top-level element, so the `keys.length === 1` branch is the practical path. The `else` is defensive in case the parser ever returns a multi-keyed object (e.g., when a `<?xml ... ?>` declaration is somehow surfaced as a key by future parser changes).

### `index.ts` extension

```ts
import { convert as jsonToXml } from "./json-xml";
import { convert as xmlToJson } from "./xml-json";

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  // (TOML entries land via the JSON↔TOML plan — independent)
  "JSON→XML": jsonToXml,
  "XML→JSON": xmlToJson,
};
```

---

## Data Flow

No change. The runtime path established by `Converter.tsx` already handles any pair the dispatch table answers:

1. User edits the left `CodePane` → `handleInput` → `convert(value)`.
2. `convert` calls `dispatch(from, to, val, { indent: indentVal })`.
3. Dispatch resolves `"JSON→XML"` / `"XML→JSON"` and invokes the module.
4. Success → `setOutput` + green status. Throw → existing `catch` shows red status.

---

## Error Handling

All errors propagate to the existing `try/catch` in `Converter.tsx`. The status strip already truncates to `e.message.split("\n")[0]`.

| Source | Trigger | Message |
|---|---|---|
| `json-xml` | whitespace-only input | `Input is empty` |
| `json-xml` | invalid JSON | native `SyntaxError` text |
| `json-xml` | non-object top level | `XML requires an object at the top level` |
| `json-xml` | invalid XML name in key | `Invalid XML element name in JSON key: "<key>"` |
| `xml-json` | whitespace-only input | `Input is empty` |
| `xml-json` | malformed XML | `fast-xml-parser` `Error` text (often with line info) |

No new error UI; no try/catch inside the converter modules.

---

## Testing

Vitest, colocated under `__tests__/`, mirroring the YAML test files.

### `json-xml.test.ts`
- flat object → `<root><k>v</k></root>` with declaration prefix
- nested object → nested elements with correct indent
- array of primitives → repeated sibling tags (Option A)
- array of objects → repeated parent tags, each with child elements
- mixed types preserved (string, number, boolean) — boolean and number become string content (XML has no scalar types)
- `null` value → empty element
- rejects top-level array, scalar, and `null` with the documented error
- rejects keys with space, keys starting with digit, keys with `@`
- throws `SyntaxError` on invalid JSON
- throws on whitespace-only input
- honors `indent: 2`, `indent: 4`, and `indent: "\t"` (tab → 2-space fallback)

### `xml-json.test.ts`
- flat XML with declaration → unwrapped flat object
- nested elements → nested object
- repeated same-named siblings → JS array
- numeric content → number, boolean content (`true`/`false`) → boolean
- attributes are dropped (documented lossy)
- malformed XML (unclosed tag, mismatched tag) → throws with `fast-xml-parser` error
- whitespace-only input throws
- respects `indent: 2`, `indent: 4`, `indent: "\t"`

### `index.test.ts` (extension)
- adds routing tests for `"JSON→XML"` and `"XML→JSON"`
- the existing "unsupported pair" example may need updating if it currently uses a now-supported pair; pick something still unsupported (e.g. `CSV→INI`)

---

## Dependency

```
pnpm add fast-xml-parser
```

Added to `dependencies` (runs in the browser client bundle).

---

## What Does Not Change

- `app/_lib/formats.ts` — `XML` is already in `FORMATS`.
- `app/[from]/[to]/page.tsx` — `generateStaticParams` already emits the XML routes.
- `Converter.tsx` and all UI components — toolbar, indent selector, status strip, copy/download all work unchanged.
- Existing JSON↔YAML modules and tests.
- The CodeMirror language helper already maps `XML` to `@codemirror/lang-xml`, so syntax highlighting works out of the box.
