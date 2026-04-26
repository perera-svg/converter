"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useState } from "react";
import type { Format } from "../_lib/formats";
import {
  pairHref,
  SAMPLE_INPUT,
  SAMPLE_OUTPUT,
} from "../_lib/formats";
import { CodePane } from "./CodePane";
import { Icon } from "./Icon";

type Status = { ok: boolean; msg: string } | null;

export function Converter({ from, to }: { from: Format; to: Format }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState("2");
  const [status, setStatus] = useState<Status>(null);
  const [convTime, setConvTime] = useState<string | null>(null);

  const convert = (val: string) => {
    if (!val.trim()) {
      setOutput("");
      setStatus(null);
      setConvTime(null);
      return;
    }
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      // Mock conversion — validates JSON when source is JSON, otherwise accepts as-is.
      if (from === "JSON") JSON.parse(val);
      setOutput(SAMPLE_OUTPUT);
      setStatus({ ok: true, msg: `✓ Valid ${from}` });
    } catch (e) {
      const message = e instanceof Error ? e.message.split("\n")[0] : "parse error";
      if (from !== "JSON") {
        setOutput(SAMPLE_OUTPUT);
        setStatus({ ok: true, msg: `✓ Valid ${from}` });
      } else {
        setOutput("");
        setStatus({ ok: false, msg: `✗ Invalid JSON: ${message}` });
      }
    }
    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setConvTime((t1 - t0).toFixed(1));
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    convert(e.target.value);
  };
  const handleSample = () => {
    setInput(SAMPLE_INPUT);
    convert(SAMPLE_INPUT);
  };
  const handleClear = () => {
    setInput("");
    setOutput("");
    setStatus(null);
    setConvTime(null);
  };
  const handleSwap = () => {
    router.push(pairHref(to, from));
  };
  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  const handleDownload = () => {
    if (!output) return;
    const ext = to.toLowerCase();
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const bytes = new TextEncoder().encode(input).length;
  const lines = input ? input.split("\n").length : 0;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "stretch",
          minHeight: 340,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CodePane
            label={from}
            value={input}
            onChange={handleInput}
            placeholder={`Paste your ${from} here...`}
          >
            <button type="button" className="btn" onClick={handleSample}>
              <Icon name="FileText" size={13} />
              Sample
            </button>
            <label className="btn" style={{ cursor: "pointer" }}>
              <Icon name="Upload" size={13} />
              Upload
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = (ev) => {
                    const text = String(ev.target?.result ?? "");
                    setInput(text);
                    convert(text);
                  };
                  r.readAsText(f);
                }}
              />
            </label>
            <button type="button" className="btn" onClick={handleClear}>
              <Icon name="X" size={13} />
              Clear
            </button>
          </CodePane>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "0 2px",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={handleSwap}
            style={{ flexDirection: "column", padding: "10px 8px", gap: 4 }}
            aria-label={`Swap to ${to} → ${from}`}
          >
            <Icon name="ArrowLeftRight" size={15} />
            <span style={{ fontSize: 10, letterSpacing: "0.06em" }}>SWAP</span>
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CodePane
            label={to}
            value={output}
            readOnly
            placeholder={`${to} output will appear here...`}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginRight: 8,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                Indent:
              </span>
              <select
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 12,
                  color: "var(--text)",
                  outline: "none",
                }}
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="tab">Tab</option>
              </select>
            </div>
            <button
              type="button"
              className="btn"
              onClick={handleCopy}
              disabled={!output}
            >
              {copied ? (
                <Icon name="Check" size={13} />
              ) : (
                <Icon name="Copy" size={13} />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleDownload}
              disabled={!output}
            >
              <Icon name="Download" size={13} />
              Download
            </button>
          </CodePane>
        </div>
      </div>

      <div
        className="status-strip"
        style={{ borderRadius: "0 0 8px 8px", marginTop: -1 }}
      >
        {status ? (
          <span
            className={status.ok ? "status-ok" : ""}
            style={status.ok ? {} : { color: "#f87171", fontWeight: 600 }}
          >
            {status.msg}
          </span>
        ) : (
          <span style={{ color: "var(--text-faint)" }}>Awaiting input…</span>
        )}
        <div className="sep" />
        <span>{bytes > 0 ? `${bytes} B` : "0 B"}</span>
        <span>{lines > 0 ? `${lines} lines` : "—"}</span>
        {convTime && (
          <>
            <div className="sep" />
            <span>
              <Icon
                name="Zap"
                size={10}
                style={{ display: "inline", marginRight: 3 }}
              />
              {convTime} ms
            </span>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div className="trust-badge">
          <Icon name="Shield" size={13} style={{ color: "var(--accent)" }} />
          Runs entirely in your browser. Your data never leaves your device.
        </div>
      </div>
    </>
  );
}
