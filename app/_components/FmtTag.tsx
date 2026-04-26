import type { Format } from "../_lib/formats";

export function FmtTag({ fmt }: { fmt: Format }) {
  return <span className={`tag tag-${fmt.toLowerCase()}`}>{fmt}</span>;
}
