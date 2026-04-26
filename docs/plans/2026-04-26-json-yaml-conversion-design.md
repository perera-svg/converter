# JSON ↔ YAML Conversion — Design

**Date:** 2026-04-26  
**Status:** Approved  
**Scope:** JSON → YAML and YAML → JSON, client-side, using the `yaml` npm package

---

## Problem

The `Converter` component currently mocks conversion — it validates JSON syntax but always returns the hardcoded `SAMPLE_OUTPUT` string regardless of input. Real conversion logic needs to be wired up for the JSON ↔ YAML pair.

---

## Decisions

- **Both directions:** JSON → YAML and YAML → JSON (both are listed as POPULAR pairs)
- **Library:** `yaml` package — full YAML 1.2 support, built-in TypeScript types
- **Architecture:** Per-pair converter modules (Option C)

---

## File Structure

```
app/_lib/
  formats.ts              (existing — unchanged)
  converters/
    json-yaml.ts          (new)
    yaml-json.ts          (new)
    index.ts              (new — dispatch table)
```

---

## Converter Modules

Each module exports a single `convert(input, options)` function.

```ts
type ConvertOptions = { indent: number | string }
```

**`json-yaml.ts`**
1. `JSON.parse(input)` — throws `SyntaxError` on invalid JSON
2. `yaml.stringify(parsed, { indent })` — respects indent option
3. Return YAML string

**`yaml-json.ts`**
1. `yaml.parse(input)` — throws on invalid YAML
2. `JSON.stringify(parsed, null, indent)` — standard JSON serialization
3. Return JSON string

**`index.ts`**
- Exports a `dispatch(from, to, input, options)` function keyed on `"JSON→YAML"` / `"YAML→JSON"`
- Returns `null` (or throws) if pair is unsupported

---

## Integration: `Converter.tsx`

The mock block in `convert()` is replaced with:

```ts
const indentVal = indent === "tab" ? "\t" : Number(indent);
const result = dispatch(from, to, val, { indent: indentVal });
setOutput(result);
setStatus({ ok: true, msg: `✓ Valid ${from}` });
```

Errors thrown by converter modules propagate to the existing `catch` block, which already handles `status.ok = false` display.

No other files change — routing, UI, status strip, copy/download, and indent selector are all unaffected.

---

## Dependency

```
pnpm add yaml
```

Added to `dependencies` (runs in the browser client bundle).

---

## What Does Not Change

- `app/_lib/formats.ts`
- `app/[from]/[to]/page.tsx`
- All UI components except `Converter.tsx`
- Indent selector UI (already renders; now its value is used)
- Status strip error display (already handles `ok: false`)
