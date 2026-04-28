# JSON ↔ XML Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JSON→XML and XML→JSON conversion to the converter app using `fast-xml-parser`, following the exact same per-module pattern established by the JSON↔YAML converters.

**Architecture:** Two new converter modules (`json-xml.ts`, `xml-json.ts`) each exporting a single `convert(input, options)` function. Both are wired into the dispatch table in `index.ts`. Arrays use the "repeated tags" convention (Option A). Root element is always `<root>`. No UI changes required.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser` (XMLBuilder + XMLParser), pnpm.

---

## File Structure

**Files to create:**
- `app/_lib/converters/json-xml.ts` — JSON → XML converter
- `app/_lib/converters/xml-json.ts` — XML → JSON converter
- `app/_lib/converters/__tests__/json-xml.test.ts` — tests for json-xml
- `app/_lib/converters/__tests__/xml-json.test.ts` — tests for xml-json

**Files to modify:**
- `app/_lib/converters/index.ts` — add 2 import + 2 dispatch entries
- `app/_lib/converters/__tests__/index.test.ts` — add 2 routing tests

---

## Task 1: Install fast-xml-parser

**Files:**
- Modify: `package.json` (via pnpm, do not hand-edit)

- [ ] **Step 1: Install the dependency**

```bash
pnpm add fast-xml-parser
```

Expected: `fast-xml-parser` appears in `dependencies` in `package.json`. Version should be ≥4.4.

- [ ] **Step 2: Verify**

```bash
pnpm ls fast-xml-parser
```

Expected: prints the installed version with no warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add fast-xml-parser dependency"
```

---

## Task 2: JSON → XML converter (TDD)

**Files:**
- Create: `app/_lib/converters/__tests__/json-xml.test.ts`
- Create: `app/_lib/converters/json-xml.ts`

- [ ] **Step 1: Write the failing test file**

Create `app/_lib/converters/__tests__/json-xml.test.ts`:

```ts
import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { convert } from "../json-xml";

// Use the same parser config as xml-json.ts to verify round-trips
const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: true,
  trimValues: true,
});

describe("json-xml convert", () => {
  it("includes the XML declaration", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: 2 });
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("converts a flat object", () => {
    const result = convert(
      JSON.stringify({ name: "my-app", version: "1.0.0" }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { name: "my-app", version: "1.0.0" },
    });
  });

  it("converts a nested object", () => {
    const result = convert(
      JSON.stringify({ config: { port: 3000, host: "localhost" } }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { config: { port: 3000, host: "localhost" } },
    });
  });

  it("converts an array of primitives as repeated tags (Option A)", () => {
    const result = convert(JSON.stringify({ tags: ["web", "api"] }), {
      indent: 2,
    });
    expect(parser.parse(result)).toEqual({ root: { tags: ["web", "api"] } });
  });

  it("converts an array of objects as repeated tags", () => {
    const result = convert(
      JSON.stringify({ items: [{ name: "foo" }, { name: "bar" }] }),
      { indent: 2 },
    );
    expect(parser.parse(result)).toEqual({
      root: { items: [{ name: "foo" }, { name: "bar" }] },
    });
  });

  it("converts null value to empty element", () => {
    const result = convert(JSON.stringify({ foo: null }), { indent: 2 });
    // Empty element parses back to empty string (lossy — documented)
    const parsed = parser.parse(result) as { root: { foo: string } };
    expect(parsed.root.foo).toBe("");
  });

  it("rejects a top-level array", () => {
    expect(() => convert("[1,2,3]", { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a top-level scalar", () => {
    expect(() => convert('"hello"', { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a top-level null", () => {
    expect(() => convert("null", { indent: 2 })).toThrow(
      "XML requires an object at the top level",
    );
  });

  it("rejects a key starting with a digit", () => {
    expect(() => convert('{"123abc":"x"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "123abc"',
    );
  });

  it("rejects a key containing a space", () => {
    expect(() => convert('{"key with space":"x"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "key with space"',
    );
  });

  it("rejects a key starting with @", () => {
    expect(() => convert('{"@id":"1"}', { indent: 2 })).toThrow(
      'Invalid XML element name in JSON key: "@id"',
    );
  });

  it("rejects an invalid key nested inside an array of objects", () => {
    expect(() =>
      convert(JSON.stringify({ items: [{ "bad key": 1 }] }), { indent: 2 }),
    ).toThrow('Invalid XML element name in JSON key: "bad key"');
  });

  it("throws SyntaxError on invalid JSON", () => {
    expect(() => convert("{ bad json }", { indent: 2 })).toThrow(SyntaxError);
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });

  it("honors indent: 4", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: 4 });
    // 4-space indent inside <root>
    expect(result).toContain("    <a>1</a>");
  });

  it("uses 2-space fallback for tab indent (XML has no tab-indent concept)", () => {
    const result = convert(JSON.stringify({ a: 1 }), { indent: "\t" });
    expect(result).toContain("  <a>1</a>");
    expect(result).not.toContain("\t<a>");
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm test -- json-xml
```

Expected: `FAIL` — `Cannot find module '../json-xml'`.

- [ ] **Step 3: Implement json-xml.ts**

Create `app/_lib/converters/json-xml.ts`:

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
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
pnpm test -- json-xml
```

Expected: all tests in `json-xml.test.ts` pass.

- [ ] **Step 5: Lint**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/_lib/converters/json-xml.ts app/_lib/converters/__tests__/json-xml.test.ts
git commit -m "feat: add JSON→XML converter"
```

---

## Task 3: XML → JSON converter (TDD)

**Files:**
- Create: `app/_lib/converters/__tests__/xml-json.test.ts`
- Create: `app/_lib/converters/xml-json.ts`

- [ ] **Step 1: Write the failing test file**

Create `app/_lib/converters/__tests__/xml-json.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { convert } from "../xml-json";

describe("xml-json convert", () => {
  it("converts a flat XML document (with declaration) to JSON", () => {
    const input = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<root>",
      "  <name>my-app</name>",
      "  <version>1.0.0</version>",
      "</root>",
    ].join("\n");
    const result = convert(input, { indent: 2 });
    expect(JSON.parse(result)).toEqual({ name: "my-app", version: "1.0.0" });
  });

  it("converts a flat XML document (without declaration) to JSON", () => {
    const result = convert(
      "<root><name>my-app</name></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ name: "my-app" });
  });

  it("converts nested elements to a nested object", () => {
    const result = convert(
      "<root><config><port>3000</port></config></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ config: { port: 3000 } });
  });

  it("converts repeated same-named siblings to an array", () => {
    const result = convert(
      "<root><tags>web</tags><tags>api</tags></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ tags: ["web", "api"] });
  });

  it("converts repeated object siblings to an array of objects", () => {
    const result = convert(
      "<root><item><name>foo</name></item><item><name>bar</name></item></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({
      item: [{ name: "foo" }, { name: "bar" }],
    });
  });

  it("coerces numeric text content to number", () => {
    const result = convert("<root><port>3000</port></root>", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ port: 3000 });
  });

  it("coerces boolean text content to boolean", () => {
    const result = convert(
      "<root><debug>true</debug><verbose>false</verbose></root>",
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ debug: true, verbose: false });
  });

  it("drops XML attributes (documented lossy direction)", () => {
    const result = convert(
      '<root><foo id="1">bar</foo></root>',
      { indent: 2 },
    );
    expect(JSON.parse(result)).toEqual({ foo: "bar" });
  });

  it("unwraps the single root element", () => {
    // <root> wrapper from JSON→XML is removed so round-trips are clean
    const result = convert("<root><a>1</a></root>", { indent: 2 });
    const parsed = JSON.parse(result);
    expect(parsed).not.toHaveProperty("root");
    expect(parsed).toHaveProperty("a", 1);
  });

  it("respects indent: 2", () => {
    const result = convert("<root><a>1</a></root>", { indent: 2 });
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("respects indent: 4", () => {
    const result = convert("<root><a>1</a></root>", { indent: 4 });
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it("respects indent: tab", () => {
    const result = convert("<root><a>1</a></root>", { indent: "\t" });
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it("throws on malformed XML", () => {
    // << inside element content is definitively unparseable
    expect(() => convert("<root><a><<</a></root>", { indent: 2 })).toThrow();
  });

  it("throws on whitespace-only input", () => {
    expect(() => convert("   ", { indent: 2 })).toThrow("Input is empty");
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm test -- xml-json
```

Expected: `FAIL` — `Cannot find module '../xml-json'`.

- [ ] **Step 3: Implement xml-json.ts**

Create `app/_lib/converters/xml-json.ts`:

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

  // Unwrap the single top-level element to keep round-trips clean.
  // Any valid XML has exactly one root element, so keys.length === 1
  // is the normal path. The else branch is a defensive fallback.
  const keys = Object.keys(parsed);
  const data = keys.length === 1 ? parsed[keys[0]] : parsed;

  const indent = options.indent === "\t" ? "\t" : Number(options.indent);
  return JSON.stringify(data, null, indent);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
pnpm test -- xml-json
```

Expected: all tests in `xml-json.test.ts` pass.

- [ ] **Step 5: Lint**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/_lib/converters/xml-json.ts app/_lib/converters/__tests__/xml-json.test.ts
git commit -m "feat: add XML→JSON converter"
```

---

## Task 4: Wire into dispatch table and add routing tests

**Files:**
- Modify: `app/_lib/converters/index.ts:1-11`
- Modify: `app/_lib/converters/__tests__/index.test.ts:1-20`

- [ ] **Step 1: Update index.ts**

Replace the full content of `app/_lib/converters/index.ts` with:

```ts
import type { Format } from "../formats";
import type { ConvertOptions } from "./types";
import { convert as jsonToXml } from "./json-xml";
import { convert as jsonToYaml } from "./json-yaml";
import { convert as xmlToJson } from "./xml-json";
import { convert as yamlToJson } from "./yaml-json";

type ConverterFn = (input: string, options: ConvertOptions) => string;

const converters: Partial<Record<string, ConverterFn>> = {
  "JSON→YAML": jsonToYaml,
  "YAML→JSON": yamlToJson,
  "JSON→XML": jsonToXml,
  "XML→JSON": xmlToJson,
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
```

- [ ] **Step 2: Update index.test.ts**

Replace the full content of `app/_lib/converters/__tests__/index.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { dispatch } from "../index";

describe("dispatch", () => {
  it("routes JSON→YAML", () => {
    const result = dispatch("JSON", "YAML", JSON.stringify({ a: 1 }), {
      indent: 2,
    });
    expect(result).toBe("a: 1\n");
  });

  it("routes YAML→JSON", () => {
    const result = dispatch("YAML", "JSON", "a: 1\n", { indent: 2 });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("routes JSON→XML", () => {
    const result = dispatch("JSON", "XML", JSON.stringify({ a: 1 }), {
      indent: 2,
    });
    expect(result).toContain("<a>1</a>");
  });

  it("routes XML→JSON", () => {
    const result = dispatch("XML", "JSON", "<root><a>1</a></root>", {
      indent: 2,
    });
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it("throws for unsupported pair", () => {
    expect(() =>
      dispatch("JSON", "TOML", "{}", { indent: 2 }),
    ).toThrow("Unsupported conversion: JSON→TOML");
  });
});
```

- [ ] **Step 3: Run the full test suite**

```bash
pnpm test
```

Expected: all 4 test files pass (json-yaml, yaml-json, json-xml, xml-json, index — 5 files total), 0 failures.

- [ ] **Step 4: Lint**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/_lib/converters/index.ts app/_lib/converters/__tests__/index.test.ts
git commit -m "feat: wire JSON↔XML into dispatch table"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full test run**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Production build**

```bash
pnpm run build
```

Expected: build succeeds. The `/json/xml` and `/xml/json` routes appear in the static page list.

- [ ] **Step 4: Commit (if anything needed fixing)**

Only commit if steps 1–3 required changes. If all passed cleanly, no additional commit needed.

---

## Out of scope

- TOML conversion — covered by a separate plan (`2026-04-26-json-toml-conversion-design.md`)
- XML attribute emission from JSON (the `@key` convention) — not needed for config-data use cases
- Configurable root element name — v1 uses fixed `<root>`
- XML namespace handling
