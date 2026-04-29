# Coming Soon Labels for Unimplemented Converters

**Date:** 2026-04-29

## Problem

The hub grid shows all format pairs (30 total), but only 6 converters are implemented. Clicking an unimplemented pair leads to a broken experience. Users need a clear signal that those converters are not yet available.

## Goal

Show a "Coming Soon" label on unimplemented converter cards and disable navigation to them.

## Approach: Data-driven flag in `formats.ts`

### Data layer (`formats.ts`)

Add an `IMPLEMENTED_PAIRS` set of strings (e.g. `"JSON→YAML"`). Export a helper:

```ts
export function isPairImplemented(from: Format, to: Format): boolean {
  return IMPLEMENTED_PAIRS.has(`${from}→${to}`);
}
```

Update this set whenever a new converter ships.

### `ConverterCard` component

Add `comingSoon?: boolean` prop. When true:
- Render a `<div>` instead of `<Link>` (no navigation)
- Reduce opacity to `0.55`
- Set `cursor: not-allowed`
- Replace the chevron icon with a "Coming Soon" pill badge (muted background, ~11px text)

### `HubGrid` component

Pass `comingSoon={!isPairImplemented(p.from, p.to)}` to every `ConverterCard`. No other changes.

## Implemented pairs (at time of writing)

- JSON → YAML
- YAML → JSON
- JSON → XML
- XML → JSON
- JSON → CSV
- CSV → JSON

## Non-goals

- Hiding coming-soon cards from search (they remain visible as informational)
- Showing a tooltip or popover on hover
