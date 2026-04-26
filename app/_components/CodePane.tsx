"use client";

import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import type { Format } from "../_lib/formats";
import { getLanguageExtension } from "./codemirror-language";
import { appTheme } from "./codemirror-theme";

export function CodePane({
  label,
  format,
  value,
  onChange,
  placeholder,
  readOnly,
  children,
}: {
  label: string;
  format: Format;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="code-pane"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="pane-toolbar">
        <span className="pane-label">{label}</span>
        {children}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          editable={!readOnly}
          extensions={[
            getLanguageExtension(format),
            appTheme,
            EditorView.lineWrapping,
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            autocompletion: false,
            searchKeymap: false,
          }}
          theme="none"
          height="100%"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
