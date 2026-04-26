import { HubGrid } from "./_components/HubGrid";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "72px 20px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Developer Tools
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            margin: "0 0 16px",
            color: "var(--text)",
          }}
        >
          Convert between JSON, YAML,
          <br />
          TOML, XML, CSV and INI.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-muted)",
            margin: "0 0 40px",
            maxWidth: 540,
            lineHeight: 1.6,
          }}
        >
          Fast, free, and runs entirely in your browser. No uploads, no
          servers, no accounts.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >
        <HubGrid />
      </div>
    </main>
  );
}
