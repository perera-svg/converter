import Link from "next/link";
import type { Format } from "../_lib/formats";
import { pairHref } from "../_lib/formats";
import { FmtTag } from "./FmtTag";
import { Icon } from "./Icon";

export function ConverterCard({
  from,
  to,
  small,
}: {
  from: Format;
  to: Format;
  small?: boolean;
}) {
  return (
    <Link
      href={pairHref(from, to)}
      className="card card-hover"
      style={{
        padding: small ? "10px 14px" : "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <FmtTag fmt={from} />
      <Icon
        name="ArrowRight"
        size={13}
        style={{ color: "var(--text-faint)", flexShrink: 0 }}
      />
      <FmtTag fmt={to} />
      {!small && (
        <Icon
          name="ChevronRight"
          size={13}
          style={{ color: "var(--text-faint)", marginLeft: "auto" }}
        />
      )}
    </Link>
  );
}
