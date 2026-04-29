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
      <div style={{ cursor: "not-allowed" }}>
        <div
          className="card"
          role="link"
          aria-disabled="true"
          tabIndex={-1}
          style={{
            ...sharedStyle,
            opacity: 0.55,
            pointerEvents: "none",
          }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <Link href={pairHref(from, to)} className="card card-hover" style={sharedStyle}>
      {inner}
    </Link>
  );
}
