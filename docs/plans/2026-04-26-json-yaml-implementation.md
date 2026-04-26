# JSON ↔ YAML Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mock `convert()` in `Converter.tsx` with real JSON↔YAML conversion using the `yaml` npm package, via per-pair converter modules.

**Architecture:** Three new files under `app/_lib/converters/` — `json-yaml.ts`, `yaml-json.ts`, and `index.ts` (dispatch table). `Converter.tsx` calls `dispatch()` instead of its inline mock. Tests live alongside the modules using Vitest.

**Tech Stack:** `yaml` (2.x, YAML 1.2 parser/serializer), Vitest (test runner), TypeScript 5, Next.js 16, pnpm.

---

## Context

- **Mock location:** `app/_components/Converter.tsx`, lines 26–53 — the `convert()` inner function
- **Format definitions:** `app/_lib/formats.ts` — `Format` type is `"JSON" | "YAML" | "TOML" | "XML" | "CSV" | "INI"`
- **Indent state:** `Converter.tsx` has `const [indent, setIndent] = useState("2")` — values are `"2"`, `"4"`, `"tab"`
- **YAML tab indentation:** The YAML spec forbids tabs as indentation. When `indent === "tab"` for JSON→YAML output, default to `2`.
- **yaml package API:**
  - `yaml.parse(str: string): unknown` — throws `YAMLParseError` on invalid input
  - `yaml.stringify(value: unknown, options?: { indent?: number }): string`

---

### Task 1: Install `yaml` and set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Step 1: Install dependencies**

```bash
pnpm add yaml
pnpm add -D vitest
```

**Step 2: Add test script to `package.json`**

Open `package.json` and add `"test": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check",
  "format": "biome format --write",
  "test": "vitest run"
}
```

**Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

**Step 4: Verify Vitest works**

```bash
pnpm test
```

Expected: `No test files found` (no failures — Vitest exits 0 when there are no test files).

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add yaml package and vitest"
```

---

### Task 2: Create the shared `ConvertOptions` type

**Files:**
- Create: `app/_lib/converters/types.ts`

**Step 1: Write the file**

```ts
export type ConvertOptions = {
  indent: number | string;
};
```

No test needed — it's a type-only file.

**Step 2: Commit**

```bash
git add app/_lib/converters/types.ts
git commit -m "feat: add ConvertOptions type"
```

---

### Task 3: Implement `json-yaml.ts` with tests

**Files:**
- Create: `app/_lib/converters/json-yaml.ts`
- Create: `app/_lib/converters/__tests__/json-yaml.test.ts`

**Step 1: Write the failing tests**

Create `app/_lib/converters/__tests__/json-yaml.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { convert } from "../json-yaml";

describe("json-yaml convert", () => {
  it("converts a flat object", () => {
    const input = JSON.stringify({ name: "my-app", version: "1.0.0" });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("name: my-app\nversion: 1.0.0\n");
  });

  it("converts a nested object", () => {
    const input = JSON.stringify({ config: { port: 3000 } });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("config:\n  port: 3000\n");
  });

  it("converts arrays", () => {
    const input = JSON.stringify({ tags: ["web", "api"] });
    const result = convert(input, { indent: 2 });
    expect(result).toBe("tags:\n  - web\n  - api\n");
  });

  it("respects indent: 4", () => {
    const input = JSON.stringify({ config: { port: 3000 } });
    const result = convert(input, { indent: 4 });
    expect(result).toBe("config:\n    port: 3000\n");
  });

  it("falls back to indent 2 when given a tab string", () => {
    const input = JSON.stringify({ a: 1 });
    const tabResult = convert(input, { indent: "\t" });
    const defaultResult = convert(input, { indent: 2 });
    expect(tabResult).toBe(defaultResult);
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws on empty input after trim", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '../json-yaml'`

**Step 3: Implement `json-yaml.ts`**

Create `app/_lib/converters/json-yaml.ts`:

```ts
import * as yaml from "yaml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = JSON.parse(input);
  const indent = typeof options.indent === "string" ? 2 : options.indent;
  return yaml.stringify(parsed, { indent });
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: All 7 tests PASS.

**Step 5: Commit**

```bash
git add app/_lib/converters/json-yaml.ts app/_lib/converters/__tests__/json-yaml.test.ts
git commit -m "feat: add JSON→YAML converter"
```

---

### Task 4: Implement `yaml-json.ts` with tests

**Files:**
- Create: `app/_lib/converters/yaml-json.ts`
- Create: `app/_lib/converters/__tests__/yaml-json.test.ts`

**Step 1: Write the failing tests**

Create `app/_lib/converters/__tests__/yaml-json.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { convert } from "../yaml-json";

describe("yaml-json convert", () => {
  it("converts a flat YAML object", () => {
    const input = "name: my-app\nversion: 1.0.0\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "my-app", version: "1.0.0" });
  });

  it("converts nested YAML", () => {
    const input = "config:\n  port: 3000\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ config: { port: 3000 } });
  });

  it("converts YAML arrays", () => {
    const input = "tags:\n  - web\n  - api\n";
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ tags: ["web", "api"] });
  });

  it("respects indent: 4", () => {
    const input = "config:\n  port: 3000\n";
    const result = convert(input, { indent: 4 });
    expect(result).toBe('{\n    "config": {\n        "port": 3000\n    }\n}');
  });

  it("respects indent: tab", () => {
    const input = "a: 1\n";
    const result = convert(input, { indent: "\t" });
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it("throws on invalid YAML", () => {
    expect(() => convert("{ invalid: yaml: here }", { indent: 2 })).toThrow();
  });

  it("throws on empty input after trim", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '../yaml-json'`

**Step 3: Implement `yaml-json.ts`**

Create `app/_lib/converters/yaml-json.ts`:

```ts
import * as yaml from "yaml";
import type { ConvertOptions } from "./types";

export function convert(input: string, options: ConvertOptions): string {
  if (!input.trim()) throw new Error("Input is empty");
  const parsed = yaml.parse(input) as unknown;
  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(parsed, null, indent);
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: All 14 tests PASS (7 from Task 3 + 7 from Task 4).

**Step 5: Commit**

```bash
git add app/_lib/converters/yaml-json.ts app/_lib/converters/__tests__/yaml-json.test.ts
git commit -m "feat: add YAML→JSON converter"
```

---

### Task 5: Create the dispatch `index.ts`

**Files:**
- Create: `app/_lib/converters/index.ts`
- Create: `app/_lib/converters/__tests__/index.test.ts`

**Step 1: Write the failing test**

Create `app/_lib/converters/__tests__/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dispatch } from "../index";

describe("dispatch", () => {
  it("routes JSON→YAML", () => {
    const result = dispatch("JSON", "YAML", JSON.stringify({ a: 1 }), { indent: 2 });
    expect(result).toBe("a: 1\n");
  });

  it("routes YAML→JSON", () => {
    const result = dispatch("YAML", "JSON", "a: 1\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("throws for unsupported pair", () => {
    expect(() => dispatch("JSON", "TOML", "{}", { indent: 2 })).toThrow(
      "Unsupported conversion: JSON→TOML"
    );
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '../index'`

**Step 3: Implement `index.ts`**

Create `app/_lib/converters/index.ts`:

```ts
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
```

**Step 4: Run all tests**

```bash
pnpm test
```

Expected: All 17 tests PASS.

**Step 5: Commit**

```bash
git add app/_lib/converters/index.ts app/_lib/converters/__tests__/index.test.ts
git commit -m "feat: add converter dispatch table"
```

---

### Task 6: Wire dispatch into `Converter.tsx`

**Files:**
- Modify: `app/_components/Converter.tsx` (lines 26–53 — the `convert()` inner function)

**Step 1: Replace the mock `convert()` function**

Open `app/_components/Converter.tsx`. Find the `convert` function (starts at line 26). Replace the entire function body with the real implementation.

Add this import at the top of the file (after the existing imports):

```ts
import { dispatch } from "../_lib/converters/index";
```

Replace the body of `convert` (lines 27–53) with:

```ts
const convert = (val: string) => {
  if (!val.trim()) {
    setOutput("");
    setStatus(null);
    setConvTime(null);
    return;
  }
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const indentVal = indent === "tab" ? "\t" : Number(indent);
    const result = dispatch(from, to, val, { indent: indentVal });
    setOutput(result);
    setStatus({ ok: true, msg: `✓ Valid ${from}` });
  } catch (e) {
    setOutput("");
    setStatus({
      ok: false,
      msg: `✗ ${e instanceof Error ? e.message.split("\n")[0] : "parse error"}`,
    });
  }
  const t1 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  setConvTime((t1 - t0).toFixed(1));
};
```

Also remove the now-unused imports from `Converter.tsx`:

```ts
// Remove this line:
import { pairHref, SAMPLE_INPUT, SAMPLE_OUTPUT } from "../_lib/formats";
// Replace with:
import { pairHref, SAMPLE_INPUT } from "../_lib/formats";
```

**Step 2: Run lint to catch any issues**

```bash
pnpm lint
```

Expected: No errors.

**Step 3: Run the dev server and manually verify**

```bash
pnpm dev
```

1. Open `http://localhost:3000/json/yaml`
2. Click "Sample" — input pane fills with sample JSON
3. Output pane should show real YAML (not the hardcoded sample)
4. Edit a key in the input — output updates in real time
5. Type invalid JSON — status strip shows `✗ Invalid JSON: ...`
6. Change indent to 4 — output re-renders with 4-space indent
7. Click "SWAP" — navigate to `/yaml/json`, paste YAML, verify JSON output

**Step 4: Run all tests one final time**

```bash
pnpm test
```

Expected: All 17 tests PASS.

**Step 5: Commit**

```bash
git add app/_components/Converter.tsx
git commit -m "feat: wire real JSON↔YAML conversion into Converter"
```

---

## Done

All conversion logic lives in `app/_lib/converters/`. Adding a new format pair (e.g. JSON→TOML) means:
1. Create `app/_lib/converters/json-toml.ts` + tests
2. Add `"JSON→TOML": jsonToToml` entry in `index.ts`
