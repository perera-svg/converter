import { EditorView } from "@codemirror/view";

export const appTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--code-bg)",
    color: "var(--text)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
    fontSize: "13px",
    height: "100%",
  },
  ".cm-content": {
    padding: "14px 0",
    caretColor: "var(--accent)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--bg-card)",
    color: "var(--text-faint)",
    border: "none",
    borderRight: "1px solid var(--code-border)",
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--text-muted)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--accent)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "var(--accent-dim)",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--accent-dim)",
  },
  ".cm-scroller": {
    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
    lineHeight: "1.65",
  },
  ".cm-placeholder": {
    color: "var(--text-faint)",
    fontStyle: "normal",
  },
});
