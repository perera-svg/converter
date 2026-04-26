# JSON ↔ TOML Conversion — Design

**Date:** 2026-04-26
**Status:** Approved
**Scope:** JSON → TOML and TOML → JSON, client-side, using the `smol-toml` npm package

---

## Problem

The converter dispatch table in `app/_lib/converters/index.ts` currently only routes JSON↔YAML. The `[from]/[to]` route statically generates `/json/toml` and `/toml/json` pages, and the UI renders fully — but any conversion attempt for those pairs throws `Unsupported conversion: JSON→TOML`. We need to add real conversion logic for both TOML directions.

---

## Decisions

- **Both directions:** JSON → TOML and TOML → JSON (`JSON → TOML` is in `POPULAR`; symmetry matters because the SWAP button assumes the reverse pair works).
- **Library:** `smol-toml` — full TOML 1.0, ~7 kB gzipped, native TypeScript, both `parse` and `stringify`.
- **Architecture:** Per-direction converter modules, mirroring the existing JSON↔YAML pattern (Approach A). No premature abstraction into a codec registry — revisit when format #4 lands.
- **Top-level type:** JSON → TOML rejects non-object roots (`null`, scalars, arrays) with a clear error. TOML cannot express a top-level non-table; auto-wrapping would invent structure.
- **Indent option:** Honored only when the target is JSON. For JSON → TOML the indent dropdown is ignored (TOML serialization has no meaningful indent concept). The toolbar UI does not change.
- **Datetime handling:** TOML → JSON renders TOML datetimes as ISO 8601 strings (the result of `JSON.stringify` on a `Date`). Documented lossy direction; acceptable.

---

## File Structure

```
app/_lib/converters/
  index.ts              (existing — extend dispatch map)
  json-yaml.ts          (existing — unchanged)
  yaml-json.ts          (existing — unchanged)
  json-toml.ts          (NEW)
  toml-json.ts          (NEW)
  types.ts              (existing — unchanged)
  __tests__/
    index.test.ts       (existing — extend)
    json-yaml.test.ts   (existing — unchanged)
    yaml-json.test.ts   (existing — unchanged)
    json-toml.test.ts   (NEW)
    toml-json.test.ts   (NEW)
```

---

## Converter Modules

Each module exports a single `convert(input, options)` function with the established signature:

```ts
type ConvertOptions = { indent: number | string }
```

**`json-toml.ts`**

```ts
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
```

- `JSON.parse` throws `SyntaxError` on invalid JSON.
- Top-level guard rejects `null`, scalars, and arrays.
- `_options` intentionally unused — TOML output ignores indent.

**`toml-json.ts`**

```ts
import { parse as tomlParse } from "smol-toml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = tomlParse(input);
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(parsed, null, indent);
}
```

- `smol-toml.parse` throws `TomlError` (with line/column info) on invalid TOML.
- Indent handling matches `yaml-json.ts`.
- TOML datetimes (`Date` instances) serialize as ISO strings via `JSON.stringify`.

**`index.ts`** — extend dispatch map:

```ts
import { convert as jsonToToml } from "./json-toml";
import { convert as tomlToJson } from "./toml-json";

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  "JSON→TOML": jsonToToml,
  "TOML→JSON": tomlToJson,
};
```

---

## Data Flow

No change. The runtime path established by `Converter.tsx` already handles any pair the dispatch table answers:

1. User edits the left `CodePane` → `handleInput` → `convert(value)`.
2. `convert` calls `dispatch(from, to, val, { indent: indentVal })`.
3. Dispatch resolves `"JSON→TOML"` / `"TOML→JSON"` and invokes the module.
4. Success → `setOutput` + green status. Throw → existing `catch` shows red status.

---

## Error Handling

All errors propagate to the existing `try/catch` in `Converter.tsx`. The status strip already truncates to `e.message.split("\n")[0]`.

| Source | Trigger | Message |
|---|---|---|
| `json-toml` | whitespace-only input | `Input is empty` |
| `json-toml` | invalid JSON | native `SyntaxError` text |
| `json-toml` | non-object top level | `TOML requires an object at the top level` |
| `toml-json` | whitespace-only input | `Input is empty` |
| `toml-json` | invalid TOML | `smol-toml` `TomlError` (line/column) |

No new error UI; no try/catch inside the converter modules.

---

## Testing

Vitest, colocated under `__tests__/`, mirroring the YAML test files.

**`json-toml.test.ts`**
- flat object → `key = "value"` output
- nested object → `[section]` header
- array of primitives → inline array
- array of objects → `[[items]]` array-of-tables
- mixed types (string, number, boolean) round-trip
- rejects top-level array, scalar, and `null` with the documented error
- throws `SyntaxError` on invalid JSON
- throws on whitespace-only input
- ignores `indent` option (output identical for `2`, `4`, `"\t"`)

**`toml-json.test.ts`**
- flat key/value → object
- `[section]` → nested object
- `[[items]]` → array of objects
- inline array → JS array
- mixed types preserved
- TOML datetime → ISO 8601 string in JSON output (documented lossy)
- respects `indent: 2`, `indent: 4`, `indent: "\t"`
- throws on invalid TOML
- throws on whitespace-only input

**`index.test.ts`** (extension)
- adds routing tests for `"JSON→TOML"` and `"TOML→JSON"`
- replaces the existing "unsupported pair" example (currently `JSON→TOML`) with one that is still actually unsupported (e.g. `XML→CSV`)

---

## Dependency

```
pnpm add smol-toml
```

Added to `dependencies` (runs in the browser client bundle).

---

## What Does Not Change

- `app/_lib/formats.ts` — TOML is already in `FORMATS` and `POPULAR`.
- `app/[from]/[to]/page.tsx` — `generateStaticParams` already emits the TOML routes.
- `Converter.tsx` and all UI components — toolbar, indent selector, status strip, copy/download all work unchanged.
- Existing JSON↔YAML modules and tests.
