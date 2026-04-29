# JSON↔CSV Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add JSON → CSV and CSV → JSON conversion by wiring up two new per-direction converter modules and extending the dispatch table — following the identical pattern used for JSON↔YAML and JSON↔TOML.

**Architecture:** Two new files (`json-csv.ts`, `csv-json.ts`) each export a single `convert(input, options)` function. A dispatch table in `index.ts` routes by `"FROM→TO"` key. All errors propagate to the existing `try/catch` in `Converter.tsx` — no UI changes needed.

**Tech Stack:** Next.js 16, TypeScript, Vitest, `papaparse` (CSV), `pnpm`

---

## Task 1: Create the git worktree

Work is isolated in a worktree so `main` stays clean until the feature is complete.

**Step 1: Create the worktree**

From the repo root (`C:/Users/chama/OneDrive/Desktop/code/converter`):

```bash
git worktree add .claude/worktrees/json-csv -b feat/json-csv
```

Expected: a new directory `.claude/worktrees/json-csv` on branch `feat/json-csv`.

**Step 2: Verify**

```bash
git worktree list
```

Expected: three rows — the main worktree, `json-toml`, and the new `json-csv`.

**Step 3: Work from the worktree for all subsequent steps**

All commands below run from `.claude/worktrees/json-csv` unless otherwise stated.

---

## Task 2: Install `papaparse`

**Step 1: Add runtime dependency**

```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

Expected: both packages appear in `package.json` under `dependencies` and `devDependencies` respectively; `pnpm-lock.yaml` is updated.

**Step 2: Verify types are available**

```bash
pnpm tsc --noEmit
```

Expected: no new errors (there may be pre-existing errors — that's fine; the important thing is no new `Cannot find module 'papaparse'` error).

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add papaparse dependency for CSV conversion"
```

---

## Task 3: Implement `json-csv` (TDD)

**Files:**
- Create: `app/_lib/converters/__tests__/json-csv.test.ts`
- Create: `app/_lib/converters/json-csv.ts`

### Step 1: Write the failing tests

Create `app/_lib/converters/__tests__/json-csv.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { convert } from "../json-csv";

describe("json-csv convert", () => {
  it("converts a flat array of objects to CSV with header row", () => {
    const input = JSON.stringify([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("handles a single-column array", () => {
    const input = JSON.stringify([{ id: "1" }, { id: "2" }]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("id\n1\n2");
  });

  it("stringifies mixed primitive values (number, boolean) into CSV cells", () => {
    const input = JSON.stringify([{ active: true, count: 42, label: "x" }]);
    const result = convert(input, { indent: 2 });
    expect(result).toBe("active,count,label\ntrue,42,x");
  });

  it("produces identical output regardless of indent option", () => {
    const input = JSON.stringify([{ a: "1" }]);
    const r2 = convert(input, { indent: 2 });
    const r4 = convert(input, { indent: 4 });
    const rt = convert(input, { indent: "\t" });
    expect(r2).toBe(r4);
    expect(r2).toBe(rt);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws when top level is an object (not array)", () => {
    expect(() => convert(JSON.stringify({ a: 1 }), { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when top level is null", () => {
    expect(() => convert("null", { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when top level is a scalar", () => {
    expect(() => convert("42", { indent: 2 })).toThrow(
      "CSV requires a top-level array"
    );
  });

  it("throws when array contains non-objects (strings)", () => {
    expect(() => convert(JSON.stringify(["a", "b"]), { indent: 2 })).toThrow(
      "CSV requires an array of objects"
    );
  });

  it("throws when array contains nested objects and names the key", () => {
    const input = JSON.stringify([{ name: "Alice", config: { port: 3000 } }]);
    expect(() => convert(input, { indent: 2 })).toThrow(
      "CSV requires flat objects — nested values found at key `config`"
    );
  });

  it("throws when array contains nested arrays and names the key", () => {
    const input = JSON.stringify([{ name: "Alice", tags: ["a", "b"] }]);
    expect(() => convert(input, { indent: 2 })).toThrow(
      "CSV requires flat objects — nested values found at key `tags`"
    );
  });
});
```

### Step 2: Run tests — verify they all fail

```bash
pnpm vitest run app/_lib/converters/__tests__/json-csv.test.ts
```

Expected: all tests **FAIL** with `Cannot find module '../json-csv'` or similar. If any pass, the test is wrong.

### Step 3: Write the implementation

Create `app/_lib/converters/json-csv.ts`:

```ts
import Papa from "papaparse";
import type { ConvertOptions } from "./types";

export function convert(input: string, _options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error("CSV requires a top-level array");
  for (const item of parsed) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("CSV requires an array of objects");
    }
    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
      if (val !== null && typeof val === "object") {
        throw new Error(
          `CSV requires flat objects — nested values found at key \`${key}\``
        );
      }
    }
  }
  return Papa.unparse(parsed as Record<string, unknown>[]);
}
```

### Step 4: Run tests — verify they all pass

```bash
pnpm vitest run app/_lib/converters/__tests__/json-csv.test.ts
```

Expected: all tests **PASS**.

### Step 5: Commit

```bash
git add app/_lib/converters/json-csv.ts app/_lib/converters/__tests__/json-csv.test.ts
git commit -m "feat: add JSON→CSV converter with flat-object validation"
```

---

## Task 4: Implement `csv-json` (TDD)

**Files:**
- Create: `app/_lib/converters/__tests__/csv-json.test.ts`
- Create: `app/_lib/converters/csv-json.ts`

### Step 1: Write the failing tests

Create `app/_lib/converters/__tests__/csv-json.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { convert } from "../csv-json";

describe("csv-json convert", () => {
  it("converts CSV with header to array of objects", () => {
    const input = "name,age\nAlice,30\nBob,25";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("all cell values are strings — no dynamic typing", () => {
    const input = "active,count\ntrue,42";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result[0].active).toBe("true");
    expect(result[0].count).toBe("42");
  });

  it("respects indent: 2", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: 2 });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, 2));
  });

  it("respects indent: 4", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: 4 });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, 4));
  });

  it("respects indent: tab", () => {
    const input = "a,b\n1,2";
    const result = convert(input, { indent: "\t" });
    expect(result).toBe(JSON.stringify([{ a: "1", b: "2" }], null, "\t"));
  });

  it("skips empty lines", () => {
    const input = "name\nAlice\n\nBob\n";
    const result = JSON.parse(convert(input, { indent: 2 }));
    expect(result).toHaveLength(2);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("throws on malformed CSV and forwards papaparse error", () => {
    // A file that has more columns than headers on a row confuses strict parsers.
    // papaparse is lenient by default, but we can trigger an error with a
    // delimiter mismatch. Test that *any* papaparse error is forwarded.
    // Use an unterminated quote to guarantee a parse error:
    const input = 'name\n"unterminated';
    expect(() => convert(input, { indent: 2 })).toThrow();
  });
});
```

### Step 2: Run tests — verify they fail

```bash
pnpm vitest run app/_lib/converters/__tests__/csv-json.test.ts
```

Expected: all tests **FAIL** with `Cannot find module '../csv-json'`.

### Step 3: Write the implementation

Create `app/_lib/converters/csv-json.ts`:

```ts
import Papa from "papaparse";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const result = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (result.errors.length > 0) throw new Error(result.errors[0].message);
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(result.data, null, indent);
}
```

### Step 4: Run tests — verify they pass

```bash
pnpm vitest run app/_lib/converters/__tests__/csv-json.test.ts
```

Expected: all tests **PASS**.

### Step 5: Commit

```bash
git add app/_lib/converters/csv-json.ts app/_lib/converters/__tests__/csv-json.test.ts
git commit -m "feat: add CSV→JSON converter"
```

---

## Task 5: Wire up the dispatch table

**Files:**
- Modify: `app/_lib/converters/index.ts`
- Modify: `app/_lib/converters/__tests__/index.test.ts`

### Step 1: Write the failing dispatch tests first

Open `app/_lib/converters/__tests__/index.test.ts` and add these cases inside the existing `describe("dispatch", ...)` block:

```ts
  it("routes JSON→CSV", () => {
    const input = JSON.stringify([{ a: "1", b: "2" }]);
    const result = dispatch("JSON", "CSV", input, { indent: 2 });
    expect(result).toBe("a,b\n1,2");
  });

  it("routes CSV→JSON", () => {
    const result = dispatch("CSV", "JSON", "a,b\n1,2", { indent: 2 });
    expect(JSON.parse(result)).toEqual([{ a: "1", b: "2" }]);
  });
```

Also update the existing "throws for unsupported pair" test — it currently uses `JSON→TOML` as the example unsupported pair, but that will be supported once TOML lands. Change it to a pair that will never be supported:

```ts
  it("throws for unsupported pair", () => {
    expect(() => dispatch("XML", "CSV", "<a/>", { indent: 2 })).toThrow(
      "Unsupported conversion: XML→CSV"
    );
  });
```

### Step 2: Run tests — verify the new ones fail

```bash
pnpm vitest run app/_lib/converters/__tests__/index.test.ts
```

Expected: the two new routing tests **FAIL** with `Unsupported conversion: JSON→CSV` / `Unsupported conversion: CSV→JSON`. The existing tests still pass.

### Step 3: Extend the dispatch table

Open `app/_lib/converters/index.ts` and update it to:

```ts
import type { Format } from "../formats";
import type { ConvertOptions } from "./types";
import { convert as jsonToYaml } from "./json-yaml";
import { convert as yamlToJson } from "./yaml-json";
import { convert as jsonToCsv } from "./json-csv";
import { convert as csvToJson } from "./csv-json";

type ConverterFn = (input: string, options: ConvertOptions) => string;

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  "JSON→CSV":  jsonToCsv,
  "CSV→JSON":  csvToJson,
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
```

### Step 4: Run all tests — verify everything passes

```bash
pnpm test
```

Expected: **all tests pass** with no failures.

### Step 5: Commit

```bash
git add app/_lib/converters/index.ts app/_lib/converters/__tests__/index.test.ts
git commit -m "feat: wire JSON↔CSV into converter dispatch table"
```

---

## Task 6: Merge worktree into main

**Step 1: Confirm all tests pass in the worktree**

```bash
pnpm test
```

Expected: all pass.

**Step 2: Switch to main and merge**

Run from the repo root (not the worktree):

```bash
git checkout main
git merge feat/json-csv --no-ff -m "feat: add JSON↔CSV conversion"
```

**Step 3: Remove the worktree**

```bash
git worktree remove .claude/worktrees/json-csv
git branch -d feat/json-csv
```

**Step 4: Final test run on main**

```bash
pnpm test
```

Expected: all tests pass on `main`.
