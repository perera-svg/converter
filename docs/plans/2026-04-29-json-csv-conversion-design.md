# JSON ↔ CSV Conversion — Design

**Date:** 2026-04-29
**Status:** Approved
**Scope:** JSON → CSV and CSV → JSON, client-side, using the `papaparse` npm package

---

## Problem

The converter dispatch table in `app/_lib/converters/index.ts` currently only routes JSON↔YAML. The `[from]/[to]` route statically generates `/json/csv` and `/csv/json` pages, and the UI renders fully — but any conversion attempt for those pairs throws `Unsupported conversion: JSON→CSV`. We need to add real conversion logic for both CSV directions.

---

## Decisions

- **Both directions:** JSON → CSV and CSV → JSON (symmetry matters because the SWAP button assumes the reverse pair works).
- **Library:** `papaparse` — the most popular CSV library in the JS ecosystem; handles quoted commas, newlines in fields, BOM stripping; tree-shakeable.
- **Architecture:** Per-direction converter modules, mirroring the existing JSON↔YAML and JSON↔TOML pattern (Approach A). No new abstractions.
- **Nested objects:** JSON → CSV rejects any array element containing a nested object or array value with a clear error naming the offending key. Auto-flattening or JSON-stringifying cells are explicitly out of scope.
- **Type inference:** CSV → JSON produces all string values (`dynamicTyping: false`). Safe and predictable; avoids silent misinterpretation of values like phone numbers or zip codes.
- **Indent option:** Honored only when the target is JSON (CSV → JSON). For JSON → CSV the indent option is ignored — CSV serialization has no indent concept.

---

## File Structure

```
app/_lib/converters/
  index.ts              (existing — extend dispatch map with 2 new keys)
  json-csv.ts           (NEW)
  csv-json.ts           (NEW)
  types.ts              (existing — unchanged)
  __tests__/
    index.test.ts       (existing — extend)
    json-csv.test.ts    (NEW)
    csv-json.test.ts    (NEW)
    (all existing test files unchanged)
```

---

## Converter Modules

Each module exports a single `convert(input, options)` function with the established signature:

```ts
type ConvertOptions = { indent: number | string }
```

**`json-csv.ts`**

1. Reject whitespace-only input: `throw new Error("Input is empty")`
2. `JSON.parse(input)` — throws native `SyntaxError` on invalid JSON
3. Guard: must be a non-empty array — `throw new Error("CSV requires a top-level array")`
4. Guard: every element must be a plain (non-null, non-array) object — `throw new Error("CSV requires an array of objects")`
5. Guard: every element must be flat — `throw new Error("CSV requires flat objects — nested values found at key \`<key>\`")`
6. `Papa.unparse(parsed)` — headers from first object's keys; all rows use the same column order
7. `_options` intentionally unused

**`csv-json.ts`**

1. Reject whitespace-only input: `throw new Error("Input is empty")`
2. `Papa.parse(input, { header: true, skipEmptyLines: true, dynamicTyping: false })`
3. If `result.errors.length > 0`, throw `new Error(result.errors[0].message)`
4. `JSON.stringify(result.data, null, indent)` — respects indent option
5. Result is always an array of objects (papaparse with `header: true` always produces this shape)

**`index.ts`** — extend dispatch map:

```ts
import { convert as jsonToCsv } from "./json-csv";
import { convert as csvToJson } from "./csv-json";

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  "JSON→CSV":  jsonToCsv,
  "CSV→JSON":  csvToJson,
};
```

---

## Error Handling

All errors propagate to the existing `try/catch` in `Converter.tsx`. No new error UI needed.

| Source | Trigger | Message |
|---|---|---|
| `json-csv` | whitespace-only input | `Input is empty` |
| `json-csv` | invalid JSON | native `SyntaxError` text |
| `json-csv` | not an array | `CSV requires a top-level array` |
| `json-csv` | array contains non-objects | `CSV requires an array of objects` |
| `json-csv` | nested value found | `CSV requires flat objects — nested values found at key \`config\`` |
| `csv-json` | whitespace-only input | `Input is empty` |
| `csv-json` | malformed CSV | papaparse error message |

---

## Testing

**`json-csv.test.ts`**
- flat array of objects → valid CSV with header row
- single-column array → works correctly
- array with mixed-type primitive values (string, number, boolean) → all stringified in CSV
- rejects whitespace-only input
- rejects non-array top level (object, null, scalar)
- rejects array of non-objects (array of strings, array of arrays)
- rejects array containing a nested object — error names the offending key
- rejects array containing a nested array value — error names the offending key
- `_options` ignored — output identical for `indent: 2`, `indent: 4`, `indent: "\t"`

**`csv-json.test.ts`**
- valid CSV with header → array of objects with string values
- all cell values stay as strings (`"42"` stays `"42"`, `"true"` stays `"true"`)
- respects `indent: 2`, `indent: 4`, `indent: "\t"`
- skips empty lines
- rejects whitespace-only input
- throws on malformed CSV (papaparse error forwarded)

**`index.test.ts`** (extension)
- adds routing tests for `"JSON→CSV"` and `"CSV→JSON"`

---

## Dependency

```
pnpm add papaparse
pnpm add -D @types/papaparse
```

Added to `dependencies` (runs in the browser client bundle). Types in `devDependencies`.

---

## What Does Not Change

- `app/_lib/formats.ts` — CSV is already in `FORMATS`.
- `app/[from]/[to]/page.tsx` — `generateStaticParams` already emits the CSV routes.
- `Converter.tsx` and all UI components — toolbar, indent selector, status strip, copy/download all work unchanged.
- Existing JSON↔YAML and JSON↔TOML modules and tests.
