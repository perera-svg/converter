import Link from "next/link";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <nav
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 20px",
          height: 52,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: 0,
          }}
        >
          <Logo />
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            FormatShift
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/" className="nav-link">
          All Tools
        </Link>
        <a
          className="nav-link"
          href="https://github.com"
          target="_blank"
          rel="noreferrer noopener"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <Icon name="Github" size={15} /> GitHub
        </a>
        <div className="sep" />
        <ThemeToggle />
      </div>
    </nav>
  );
}
