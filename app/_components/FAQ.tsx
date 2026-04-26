"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "../_lib/formats";
import { Icon } from "./Icon";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {FAQ_ITEMS.map((f, i) => (
        <div key={f.q} className="faq-item">
          <button
            type="button"
            className="faq-btn"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{f.q}</span>
            <Icon
              name={open === i ? "ChevronUp" : "ChevronDown"}
              size={16}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          </button>
          {open === i && <div className="faq-body">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}
