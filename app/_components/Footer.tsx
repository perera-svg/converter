import { Logo } from "./Logo";

const FOOTER_LINKS = ["About", "Privacy", "Terms", "Contact", "GitHub"];

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-sub)",
        padding: "32px 20px",
        marginTop: 64,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Logo size={18} />
          <span
            style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
          >
            FormatShift
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              marginLeft: 8,
            }}
          >
            © 2026
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {FOOTER_LINKS.map((l) => (
            <a
              key={l}
              className="nav-link"
              href="#"
              style={{ padding: "0 4px", fontSize: 13 }}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
