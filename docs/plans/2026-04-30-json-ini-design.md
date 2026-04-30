# JSON ↔ INI Conversion — Design

**Date:** 2026-04-30
**Branch:** json-tomal (target: main)

## Context

INI is already declared as a `Format` in `app/_lib/formats.ts`. The hub grid already renders `JSON→INI` and `INI→JSON` as "Coming Soon" cards. This feature activates them.

INI is a legacy flat-config format. It supports sections (`[section]`), scalar key-value pairs, and comments. It does not support arrays, deep nesting, null, or typed booleans/numbers. Conversion is scoped to what INI can actually represent.

## Library

**`ini` npm package** — the most widely used INI library in the Node ecosystem (~15M weekly downloads, used internally by npm). API: `ini.stringify(obj)` / `ini.parse(str)`. Install with `@types/ini` for TypeScript types.

## Scope

**Supported JSON input (JSON→INI):**
- Plain object at root
- Values may be scalars (string, number, boolean) — become top-level `key = value`
- Values may be one-level-deep plain objects with scalar values — become INI `[section]` blocks

**Rejected with descriptive errors:**
- Arrays anywhere → `"INI does not support arrays — found at key \"tags\""`
- Objects nested deeper than one level → `"INI supports one level of nesting — found nested object at \"config.database\""`
- Non-object root (array, primitive, null) → `"INI requires an object at the top level"`
- Empty input → `"Input is empty"`

**INI→JSON:** No restrictions — `ini.parse` handles all valid INI and the result is serialized to JSON.

## New Files

| File | Purpose |
|---|---|
| `app/_lib/converters/json-ini.ts` | JSON → INI converter |
| `app/_lib/converters/ini-json.ts` | INI → JSON converter |
| `app/_lib/converters/__tests__/json-ini.test.ts` | Unit tests for JSON→INI |
| `app/_lib/converters/__tests__/ini-json.test.ts` | Unit tests for INI→JSON |

## Changes to Existing Files

| File | Change |
|---|---|
| `app/_lib/converters/index.ts` | Import and register `JSON→INI` and `INI→JSON` in the converters map |
| `app/_lib/formats.ts` | Add `"JSON→INI"` and `"INI→JSON"` to `IMPLEMENTED_PAIRS` |

## Data Flow

```
JSON→INI:
  input string
    → JSON.parse()
    → validate root is plain object
    → validate each value (scalar or one-level object with scalar values)
    → ini.stringify()
    → output string

INI→JSON:
  input string
    → ini.parse()
    → JSON.stringify(result, null, indent)
    → output string
```

## Test Cases

**json-ini.test.ts**
- Flat object → correct INI key-value pairs
- Sectioned object → correct `[section]` blocks
- Array at root → throws "INI requires an object at the top level"
- Array as value → throws with key name in message
- Deeply nested object → throws with key path in message
- Empty string → throws "Input is empty"

**ini-json.test.ts**
- Flat INI → correct JSON object
- Sectioned INI → nested JSON object with section keys
- Empty string → throws "Input is empty"
