"use client";

import type { ChangeEvent } from "react";
import { useRef } from "react";

export function CodePane({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  children,
}: {
  label: string;
  value: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  const lnRef = useRef<HTMLDivElement>(null);
  const lines = (value || "").split("\n");
  const count = Math.max(lines.length, 1);

  return (
    <div
      className="code-pane"
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <div className="pane-toolbar">
        <span className="pane-label">{label}</span>
        {children}
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          ref={lnRef}
          style={{
            minWidth: 42,
            width: 42,
            overflowY: "hidden",
            paddingTop: 14,
            paddingBottom: 14,
            textAlign: "right",
            paddingRight: 10,
            paddingLeft: 8,
            background: "var(--bg-card)",
            borderRight: "1px solid var(--code-border)",
            fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
            fontSize: 12,
            lineHeight: "1.65",
            color: "var(--text-faint)",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          className="code-textarea"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          onScroll={(e) => {
            if (lnRef.current)
              lnRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
          }}
          style={{ flex: 1, minHeight: 0 }}
        />
      </div>
    </div>
  );
}
