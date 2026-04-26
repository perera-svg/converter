import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConverterCard } from "../../_components/ConverterCard";
import { Converter } from "../../_components/Converter";
import { FAQ } from "../../_components/FAQ";
import { FmtTag } from "../../_components/FmtTag";
import { Icon } from "../../_components/Icon";
import {
  ALL_PAIRS,
  COMPARE_ROWS,
  USE_CASES,
  isFormat,
} from "../../_lib/formats";

type Params = { from: string; to: string };

export function generateStaticParams(): Params[] {
  return ALL_PAIRS.map((p) => ({
    from: p.from.toLowerCase(),
    to: p.to.toLowerCase(),
  }));
}

function parseParams({ from, to }: Params) {
  const src = from.toUpperCase();
  const dst = to.toUpperCase();
  if (!isFormat(src) || !isFormat(dst) || src === dst) return null;
  return { src, dst } as const;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const resolved = parseParams(await params);
  if (!resolved) return { title: "FormatShift" };
  const { src, dst } = resolved;
  return {
    title: `${src} to ${dst} Converter — FormatShift`,
    description: `Convert ${src} to ${dst} instantly. Free, private, no sign-up required. Runs entirely in your browser.`,
  };
}

export default async function ConverterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolved = parseParams(await params);
  if (!resolved) notFound();
  const { src: srcFmt, dst: dstFmt } = resolved;

  const related = ALL_PAIRS.filter(
    (p) => p.from === srcFmt || p.to === dstFmt,
  )
    .filter((p) => !(p.from === srcFmt && p.to === dstFmt))
    .slice(0, 6);

  const howItWorks = [
    {
      n: 1,
      icon: "ClipboardPaste",
      title: "Paste or upload",
      desc: `Drop your ${srcFmt} into the left pane — paste directly or upload a file from your disk.`,
    },
    {
      n: 2,
      icon: "Zap",
      title: "Instant conversion",
      desc: `Our parser validates and converts your ${srcFmt} to ${dstFmt} in milliseconds, entirely client-side.`,
    },
    {
      n: 3,
      icon: "Download",
      title: "Copy or download",
      desc: `Grab the output with one click. Download as a file or copy straight to your clipboard.`,
    },
  ] as const;

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "16px 20px 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            padding: 0,
          }}
        >
          All Tools
        </Link>
        <Icon name="ChevronRight" size={13} />
        <span style={{ color: "var(--text)" }}>
          {srcFmt} to {dstFmt}
        </span>
      </div>

      {/* H1 */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 20px 24px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(22px,3vw,34px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
            color: "var(--text)",
          }}
        >
          {srcFmt} to {dstFmt} Converter
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
          Convert {srcFmt} to {dstFmt} instantly. Free, private, no sign-up
          required.
        </p>
      </div>

      {/* Tool */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <Converter from={srcFmt} to={dstFmt} />
      </div>

      {/* Ad slot */}
      <div
        style={{
          maxWidth: 1100,
          margin: "36px auto 0",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="ad-label" style={{ marginBottom: 6 }}>
            Advertisement
          </div>
          <div
            className="ad-slot"
            style={{ width: "100%", maxWidth: 728, height: 90, margin: "0 auto" }}
          >
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              728 × 90
            </span>
          </div>
        </div>
      </div>

      {/* SEO content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 20px 0" }}>
        {/* How it works */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 32px",
              color: "var(--text)",
            }}
          >
            How it works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 24,
            }}
          >
            {howItWorks.map((s) => (
              <div
                key={s.n}
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--accent-dim)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name={s.icon}
                    size={16}
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--text)",
                    }}
                  >
                    {s.n}. {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 20px",
              color: "var(--text)",
            }}
          >
            About {srcFmt} to {dstFmt} conversion
          </h2>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.8,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <p style={{ margin: 0 }}>
              JSON (JavaScript Object Notation) is the de facto standard for
              data interchange in web APIs and configuration files. Its strict
              syntax — double-quoted keys, no trailing commas, no comments —
              makes it unambiguous and easy to parse across every programming
              language. However, for human-edited configuration, its verbosity
              can be a friction point.
            </p>
            <p style={{ margin: 0 }}>
              YAML (YAML Ain&apos;t Markup Language) solves exactly this
              problem. It uses indentation instead of brackets and quotes,
              supports inline comments, and allows multi-line strings without
              escape sequences. This makes it the format of choice for
              Kubernetes manifests, GitHub Actions workflows, Ansible
              playbooks, and Docker Compose files.
            </p>
            <p style={{ margin: 0 }}>
              Every valid JSON document is technically valid YAML 1.2, which
              means conversion is lossless in one direction. Going from YAML to
              JSON strips comments and resolves anchors, but all data values —
              strings, numbers, booleans, arrays, and nested objects — survive
              the round-trip intact.
            </p>
          </div>
        </div>

        {/* Use cases */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 24px",
              color: "var(--text)",
            }}
          >
            Common use cases
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {USE_CASES.map((u) => (
              <div key={u.title} className="card" style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <Icon
                    name={u.icon}
                    size={15}
                    style={{ color: "var(--accent)" }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {u.title}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.65,
                  }}
                >
                  {u.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 24px",
              color: "var(--text)",
            }}
          >
            {srcFmt} vs {dstFmt}
          </h2>
          <div className="card" style={{ overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>
                    <FmtTag fmt={srcFmt} />
                  </th>
                  <th>
                    <FmtTag fmt={dstFmt} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r) => (
                  <tr key={r.feature}>
                    <td>{r.feature}</td>
                    <td>{r.from}</td>
                    <td>{r.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 8px",
              color: "var(--text)",
            }}
          >
            Frequently asked questions
          </h2>
          <FAQ />
        </div>

        {/* Related */}
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: "0 0 24px",
              color: "var(--text)",
            }}
          >
            Related converters
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
              gap: 8,
            }}
          >
            {related.map((p) => (
              <ConverterCard
                key={`${p.from}-${p.to}`}
                from={p.from}
                to={p.to}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
