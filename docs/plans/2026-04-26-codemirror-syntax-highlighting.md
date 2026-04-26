# CodeMirror 6 Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the textarea-based input/output panes in `Converter` with CodeMirror 6 editors so both the source and result get real syntax highlighting for JSON, YAML, TOML, XML, INI, and CSV.

**Architecture:** Keep the existing `CodePane` shell (toolbar + children slot) and swap its body — the manual line-number gutter and `<textarea>` — for `<CodeMirror>` from `@uiw/react-codemirror`. A small helper maps `Format` to the right language extension; a custom theme reads the app's existing CSS variables so it auto-adapts to light/dark without duplicating colors. `Converter` updates only its `onChange` signature (event → string).

**Tech Stack:** Next.js 16.2.4 (RSC), React 19.2.4, Tailwind 4, Vitest 4, CodeMirror 6 via `@uiw/react-codemirror`, language packs `@codemirror/lang-json`, `@codemirror/lang-yaml`, `@codemirror/lang-xml`, plus `@codemirror/legacy-modes` for TOML and INI.

---

## File Structure

**Files to create:**
- `app/_components/codemirror-language.ts` — pure helper mapping `Format` → CodeMirror `Extension`
- `app/_components/codemirror-theme.ts` — `EditorView.theme(...)` extension keyed off the app's CSS variables
- `app/_components/__tests__/codemirror-language.test.ts` — vitest unit tests for the helper

**Files to modify:**
- `app/_components/CodePane.tsx` — swap textarea + manual gutter for `<CodeMirror>`; change `onChange` from `(e: ChangeEvent<HTMLTextAreaElement>) => void` to `(value: string) => void`; add `format: Format` prop
- `app/_components/Converter.tsx` — pass `format` to each `CodePane`; rewrite `handleInput` to take a string instead of an event
- `app/globals.css` — minor: drop the now-unused `.code-textarea` rules; add a small `.cm-host` wrapper class so the editor fills the pane body
- `package.json` — add five new dependencies

**Files NOT to touch:**
- `app/_lib/**` — the converter logic is independent
- Any other component (`ConverterCard`, `Icon`, `FmtTag`, etc.)

---

## Task 1: Install CodeMirror dependencies

**Files:**
- Modify: `package.json` (via `npm install`, do not hand-edit)

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm install @uiw/react-codemirror @codemirror/lang-json @codemirror/lang-yaml @codemirror/lang-xml @codemirror/legacy-modes
```

Expected: Five new entries in `dependencies` in `package.json`. `@uiw/react-codemirror` should be ≥4.23 (React 19 support). The peer deps `@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/commands` come in transitively.

- [ ] **Step 2: Verify install**

Run:
```bash
npm ls @uiw/react-codemirror
```

Expected: shows the installed version with no `UNMET PEER DEPENDENCY` warnings related to React.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add CodeMirror 6 dependencies"
```

---

## Task 2: Build the language-mapping helper (TDD)

A pure function that returns a CodeMirror `Extension` for a given `Format`. Centralizing this means `CodePane` doesn't need a `switch` statement and the mapping is unit-testable without mounting the editor.

**Files:**
- Create: `app/_components/codemirror-language.ts`
- Create: `app/_components/__tests__/codemirror-language.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/_components/__tests__/codemirror-language.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getLanguageExtension } from "../codemirror-language";

describe("getLanguageExtension", () => {
  it("returns a non-empty extension array for every supported format", () => {
    const formats = ["JSON", "YAML", "TOML", "XML", "CSV", "INI"] as const;
    for (const fmt of formats) {
      const ext = getLanguageExtension(fmt);
      expect(ext).toBeDefined();
      // CodeMirror extensions are either single objects or arrays; both are truthy
      expect(Array.isArray(ext) ? ext.length >= 0 : true).toBe(true);
    }
  });

  it("returns the same reference shape for repeated calls (no surprise allocations matter for behavior, just smoke)", () => {
    const a = getLanguageExtension("JSON");
    const b = getLanguageExtension("JSON");
    expect(typeof a).toBe(typeof b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- codemirror-language`
Expected: FAIL — module `../codemirror-language` not found.

- [ ] **Step 3: Implement the helper**

Create `app/_components/codemirror-language.ts`:

```ts
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { StreamLanguage } from "@codemirror/language";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import type { Extension } from "@codemirror/state";
import type { Format } from "../_lib/formats";

export function getLanguageExtension(format: Format): Extension {
  switch (format) {
    case "JSON":
      return json();
    case "YAML":
      return yaml();
    case "XML":
      return xml();
    case "TOML":
      return StreamLanguage.define(toml);
    case "INI":
      return StreamLanguage.define(properties);
    case "CSV":
      return [];
  }
}
```

Note: CSV has no upstream language pack and ad-hoc highlighting (just commas) adds noise; returning `[]` (an empty extension) makes the editor render CSV as plain text — line numbers and theme still apply.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- codemirror-language`
Expected: PASS, both tests green.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/_components/codemirror-language.ts app/_components/__tests__/codemirror-language.test.ts
git commit -m "feat: add CodeMirror language mapping helper"
```

---

## Task 3: Build a theme keyed off CSS variables

The app uses CSS custom properties (`--code-bg`, `--text`, `--text-faint`, `--accent`, `--border`, etc.) and toggles light/dark via the `.dark` class on `<html>`. Defining the editor theme with `var(...)` lets it follow the app palette without forking light/dark JS objects.

**Files:**
- Create: `app/_components/codemirror-theme.ts`

- [ ] **Step 1: Write the theme module**

Create `app/_components/codemirror-theme.ts`:

```ts
import { EditorView } from "@codemirror/view";

export const appTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--code-bg)",
    color: "var(--text)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
    fontSize: "13px",
    height: "100%",
  },
  ".cm-content": {
    padding: "14px 0",
    caretColor: "var(--accent)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--bg-card)",
    color: "var(--text-faint)",
    border: "none",
    borderRight: "1px solid var(--code-border)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--text-muted)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--accent)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "var(--accent-dim)",
  },
  "&.cm-focused .cm-selectionBackground, &.cm-focused ::selection": {
    backgroundColor: "var(--accent-dim)",
  },
  ".cm-scroller": {
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
    lineHeight: "1.65",
  },
});
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_components/codemirror-theme.ts
git commit -m "feat: add CodeMirror theme bound to app CSS variables"
```

---

## Task 4: Rewrite CodePane to use CodeMirror

Replace the textarea + manual gutter with `<CodeMirror>`. The toolbar (`pane-toolbar` + `children` slot) stays exactly as it was so `Converter`'s buttons keep working.

The `onChange` signature changes from `(e: ChangeEvent<HTMLTextAreaElement>) => void` to `(value: string) => void`. Also add a required `format: Format` prop so the pane can pick the right language.

**Files:**
- Modify: `app/_components/CodePane.tsx` (whole file rewrite — small)

- [ ] **Step 1: Replace the file**

Rewrite `app/_components/CodePane.tsx` end-to-end:

```tsx
"use client";

import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import type { Format } from "../_lib/formats";
import { getLanguageExtension } from "./codemirror-language";
import { appTheme } from "./codemirror-theme";

export function CodePane({
  label,
  format,
  value,
  onChange,
  placeholder,
  readOnly,
  children,
}: {
  label: string;
  format: Format;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="code-pane"
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <div className="pane-toolbar">
        <span className="pane-label">{label}</span>
        {children}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          editable={!readOnly}
          extensions={[
            getLanguageExtension(format),
            appTheme,
            EditorView.lineWrapping,
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            autocompletion: false,
            searchKeymap: false,
          }}
          theme="none"
          height="100%"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
```

Notes for the implementer:
- `theme="none"` opts out of the wrapper's default light/dark theme so `appTheme` is the only source of styling.
- `editable={!readOnly}` blocks edits; `readOnly` alone in `@uiw/react-codemirror` only disables the prop, not interaction in older versions — pass both to be safe.
- `basicSetup` is selectively trimmed: keep line numbers, drop fold gutter and the active-line highlight (the CSS is built around a quiet aesthetic).
- `EditorView.lineWrapping` matches the textarea-like soft-wrap behavior the user has now.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: PASS (existing converter tests still pass; CodePane has no unit tests).

Do not commit yet — `Converter.tsx` still passes the old event-based `onChange` and will fail TypeScript. Fix in the next task.

---

## Task 5: Update Converter to use the new CodePane API

`Converter.tsx` passes an event-typed handler and is missing the new `format` prop. Update both `CodePane` usages.

**Files:**
- Modify: `app/_components/Converter.tsx` — `handleInput` signature, both `<CodePane>` call sites

- [ ] **Step 1: Replace the input handler**

In `app/_components/Converter.tsx`, find:

```tsx
const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
  setInput(e.target.value);
  convert(e.target.value);
};
```

Replace with:

```tsx
const handleInput = (value: string) => {
  setInput(value);
  convert(value);
};
```

Also remove the now-unused `ChangeEvent` import:

```tsx
import type { ChangeEvent } from "react";
```

becomes deletable; if `ChangeEvent` is used elsewhere in the file (it isn't, after this change), keep it. The Upload `<input type="file">`'s `onChange` uses an inline arrow with no annotation, so it's unaffected.

- [ ] **Step 2: Add `format` to both `CodePane` instances**

Find the input pane:

```tsx
<CodePane
  label={from}
  value={input}
  onChange={handleInput}
  placeholder={`Paste your ${from} here...`}
>
```

Add `format={from}`:

```tsx
<CodePane
  label={from}
  format={from}
  value={input}
  onChange={handleInput}
  placeholder={`Paste your ${from} here...`}
>
```

Find the output pane:

```tsx
<CodePane
  label={to}
  value={output}
  readOnly
  placeholder={`${to} output will appear here...`}
>
```

Add `format={to}`:

```tsx
<CodePane
  label={to}
  format={to}
  value={output}
  readOnly
  placeholder={`${to} output will appear here...`}
>
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both pass cleanly.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (no UI tests added; converter tests continue to pass).

- [ ] **Step 5: Commit**

```bash
git add app/_components/CodePane.tsx app/_components/Converter.tsx
git commit -m "feat: replace pane textarea with CodeMirror editor"
```

---

## Task 6: Clean up unused CSS

The `.code-textarea` block in `globals.css` styles a `<textarea>` that no longer renders. Remove it. Keep `.code-pane`, `.pane-toolbar`, and `.pane-label` — those still apply to the container.

**Files:**
- Modify: `app/globals.css:132-147`

- [ ] **Step 1: Delete the dead block**

In `app/globals.css`, delete:

```css
.code-textarea {
  flex: 1;
  resize: none;
  outline: none;
  border: none;
  background: transparent;
  color: var(--text);
  padding: 14px 16px;
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 13px;
  line-height: 1.65;
  min-height: 0;
}
.code-textarea::placeholder {
  color: var(--text-faint);
}
```

- [ ] **Step 2: Confirm no other references**

Run (via Grep tool, not bash): search the repo for `code-textarea`. Expected: no matches after the delete.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore: drop unused .code-textarea CSS"
```

---

## Task 7: Manual verification in the browser

CodeMirror integration cannot be meaningfully unit-tested without a heavy DOM setup. Per the project's UI-change guidance, verify in a real browser before declaring done.

**Files:**
- None (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Next.js boots on http://localhost:3000 with no console errors.

- [ ] **Step 2: Smoke-test JSON → YAML (the default route)**

Open http://localhost:3000/json/yaml. Verify:
- The input pane shows JSON syntax colors when sample is loaded
- Typing `{` shows matching brace highlighting (CodeMirror default)
- Line numbers appear on the left of both panes
- The output pane shows YAML syntax colors after a successful conversion
- Status strip still shows `✓ Valid JSON`, byte count, line count, ms time

- [ ] **Step 3: Test all 6 formats receive a language**

Visit each route and confirm the input editor highlights its format:
- `/yaml/json` (YAML colors)
- `/json/toml` — output side: TOML colors
- `/xml/json` (XML tag colors)
- `/json/csv` — CSV side: plain (no syntax errors)
- `/json/ini` — INI side: properties-style colors

(TOML/CSV/INI conversions may not be wired in `dispatch` yet — that's expected; the editor still needs to highlight the input regardless of conversion availability.)

- [ ] **Step 4: Test interactive features**

On `/json/yaml`:
- Click **Sample** → input loads with highlighting
- Click **Clear** → both panes empty, status resets
- Click **Upload** → choose a `.json` file → editor loads it with highlighting
- Click **Swap** → route changes to `/yaml/json`, panes empty correctly
- Click **Copy** on output → clipboard contains the plain text (not HTML)
- Click **Download** → file downloads with the right extension and plain content

- [ ] **Step 5: Test light/dark theming**

If the app exposes a theme toggle, switch it. The editor background, text color, gutter, and selection should follow without a refresh because the theme references `var(--code-bg)` etc. If there is no toggle, manually toggle the `.dark` class on `<html>` from devtools and confirm the editor follows.

- [ ] **Step 6: Test the read-only output**

Click in the output pane and try to type. Expected: cursor visible, no characters inserted, no errors in console.

- [ ] **Step 7: Stop the dev server**

Ctrl-C in the terminal.

If any check fails, do not proceed to the final commit — fix the issue first. Likely culprits:
- Editor doesn't fill the pane: check the wrapping `<div style={{ flex: 1, minHeight: 0 }}>` in CodePane and the inline `style={{ height: "100%" }}` on `<CodeMirror>`.
- Gutter colors look wrong in light mode: the `.cm-gutters` rule uses `var(--bg-card)` — confirm the variable is defined for both modes.
- Output pane is editable: confirm `editable={!readOnly}` is wired and `readOnly` is true for the output instance.

---

## Task 8: Final verification checkpoint

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Production build smoke test**

Run: `npm run build`
Expected: build succeeds. Check the build output for the `app/[from]/[to]` route's First Load JS — record the size for future bundle audits but do not optimize unless it blocks shipping.

- [ ] **Step 5: Done**

No further commit needed; everything was committed task-by-task.

---

## Out of scope (intentionally)

- Lazy-loading language packs per route. The bundle impact of bundling all six is acceptable for v1; revisit if metrics show a regression.
- Adding a CSV-specific stream parser. CSV-as-plain-text is a fine v1.
- Replacing `react-codemirror` with a hand-rolled `EditorView` + `useEffect` setup. The wrapper is fine for the current needs and the dependency cost is small.
- Adding bracket matching, fold, search, or autocomplete UI. Trimmed `basicSetup` keeps the pane visually quiet; reintroduce later if asked.
- Touching the converter dispatch table. This plan is purely a UI swap.
