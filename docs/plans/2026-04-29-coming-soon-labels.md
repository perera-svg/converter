# Coming Soon Labels Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a dimmed, non-clickable "Coming Soon" badge on converter cards that don't have an implementation yet.

**Architecture:** Add an `IMPLEMENTED_PAIRS` set and `isPairImplemented()` helper to `formats.ts` as the single source of truth. Pass a `comingSoon` boolean prop down through `HubGrid` → `ConverterCard`, where the card swaps `<Link>` for a `<div>` and renders a badge instead of the chevron.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind/CSS variables (existing design tokens)

---

### Task 1: Add `IMPLEMENTED_PAIRS` and `isPairImplemented()` to `formats.ts`

**Files:**
- Modify: `app/_lib/formats.ts`

**Step 1: Add the set and helper**

Open `app/_lib/formats.ts` and add the following immediately after the `pairHref` function at the bottom:

```ts
export const IMPLEMENTED_PAIRS = new Set([
  "JSON→YAML",
  "YAML→JSON",
  "JSON→XML",
  "XML→JSON",
  "JSON→CSV",
  "CSV→JSON",
]);

export function isPairImplemented(from: Format, to: Format): boolean {
  return IMPLEMENTED_PAIRS.has(`${from}→${to}`);
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/_lib/formats.ts
git commit -m "feat: add IMPLEMENTED_PAIRS set and isPairImplemented helper"
```

---

### Task 2: Update `ConverterCard` to support `comingSoon` prop

**Files:**
- Modify: `app/_components/ConverterCard.tsx`

**Step 1: Read the current file**

Read `app/_components/ConverterCard.tsx` to confirm the current structure before editing.

**Step 2: Apply the changes**

Replace the entire file content with:

```tsx
import Link from "next/link";
import type { Format } from "../_lib/formats";
import { pairHref } from "../_lib/formats";
import { FmtTag } from "./FmtTag";
import { Icon } from "./Icon";

export function ConverterCard({
  from,
  to,
  small,
  comingSoon,
}: {
  from: Format;
  to: Format;
  small?: boolean;
  comingSoon?: boolean;
}) {
  const inner = (
    <>
      <FmtTag fmt={from} />
      <Icon
        name="ArrowRight"
        size={13}
        style={{ color: "var(--text-faint)", flexShrink: 0 }}
      />
      <FmtTag fmt={to} />
      {!small && (
        comingSoon ? (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 99,
              background: "var(--surface-2)",
              color: "var(--text-faint)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Coming Soon
          </span>
        ) : (
          <Icon
            name="ChevronRight"
            size={13}
            style={{ color: "var(--text-faint)", marginLeft: "auto" }}
          />
        )
      )}
    </>
  );

  const sharedStyle = {
    padding: small ? "10px 14px" : "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  if (comingSoon) {
    return (
      <div
        className="card"
        style={{
          ...sharedStyle,
          opacity: 0.55,
          cursor: "not-allowed",
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={pairHref(from, to)} className="card card-hover" style={sharedStyle}>
      {inner}
    </Link>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add app/_components/ConverterCard.tsx
git commit -m "feat: add comingSoon prop to ConverterCard — renders badge, disables navigation"
```

---

### Task 3: Wire `isPairImplemented` into `HubGrid`

**Files:**
- Modify: `app/_components/HubGrid.tsx`

**Step 1: Import the helper**

In `app/_components/HubGrid.tsx`, update the import from `formats`:

```ts
import { ALL_PAIRS, FORMATS, POPULAR, isPairImplemented } from "../_lib/formats";
```

**Step 2: Pass `comingSoon` to every `ConverterCard`**

Both the Popular section and the grouped section render `ConverterCard`. Update both call sites:

Popular section (around line 67):
```tsx
<ConverterCard
  key={`${p.from}-${p.to}`}
  from={p.from}
  to={p.to}
  comingSoon={!isPairImplemented(p.from, p.to)}
/>
```

Grouped section (around line 100):
```tsx
<ConverterCard
  key={`${p.from}-${p.to}`}
  from={p.from}
  to={p.to}
  comingSoon={!isPairImplemented(p.from, p.to)}
/>
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add app/_components/HubGrid.tsx
git commit -m "feat: pass comingSoon flag to ConverterCard in HubGrid"
```

---

### Task 4: Manual smoke test in browser

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Open the app**

Navigate to `http://localhost:3000`.

**Step 3: Verify working converters**

Click "JSON → YAML" — should navigate to `/json/yaml`. Click "YAML → JSON" — should navigate to `/yaml/json`. Repeat for XML and CSV pairs.

**Step 4: Verify coming-soon converters**

Find "JSON → TOML", "JSON → INI", "YAML → TOML", etc. They should:
- Appear dimmed (opacity ~0.55)
- Show "COMING SOON" pill badge on the right
- Not navigate anywhere when clicked
- Show `cursor: not-allowed` on hover

**Step 5: Verify search**

Type "toml" in the search box. Coming-soon cards should still appear in results, correctly dimmed.

**Step 6: Stop dev server and commit if any CSS tweaks were needed**

```bash
git add -p
git commit -m "fix: adjust coming-soon badge styling"
```

---

### Task 5: Run existing test suite

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All existing tests pass. (No new tests needed — this is a pure UI labelling change with no logic branches to unit-test.)

**Step 2: If any test fails, investigate before proceeding**

Do not skip or comment out failing tests. Read the failure output carefully.
