"use client";

import { Icon } from "./Icon";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      className="btn"
      style={{ padding: "5px 8px" }}
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Icon name="Sun" size={15} /> : <Icon name="Moon" size={15} />}
    </button>
  );
}
