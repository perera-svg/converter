"use client";

import { useMemo, useState } from "react";
import { ALL_PAIRS, FORMATS, POPULAR, isPairImplemented } from "../_lib/formats";
import { ConverterCard } from "./ConverterCard";
import { Icon } from "./Icon";

export function HubGrid() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_PAIRS;
    return ALL_PAIRS.filter(
      (p) =>
        p.from.toLowerCase().includes(q) ||
        p.to.toLowerCase().includes(q) ||
        `${p.from} to ${p.to}`.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(
    () =>
      FORMATS.map((f) => ({
        format: f,
        pairs: filtered.filter((p) => p.from === f),
      })).filter((g) => g.pairs.length > 0),
    [filtered],
  );

  const showPopular = !search;

  return (
    <>
      <div style={{ position: "relative", maxWidth: 440 }}>
        <Icon
          name="Search"
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-faint)",
          }}
        />
        <input
          className="search-input"
          placeholder="Search converters — e.g. JSON to YAML"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        {showPopular && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-head">Popular</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                gap: 8,
              }}
            >
              {POPULAR.map((p) => (
                <ConverterCard
                  key={`${p.from}-${p.to}`}
                  from={p.from}
                  to={p.to}
                  comingSoon={!isPairImplemented(p.from, p.to)}
                />
              ))}
            </div>
          </div>
        )}

        {grouped.length === 0 ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            No converters match &ldquo;{search}&rdquo;
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.format} style={{ marginBottom: 40 }}>
              <div className="section-head">{g.format} →</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
                  gap: 8,
                }}
              >
                {g.pairs.map((p) => (
                  <ConverterCard
                    key={`${p.from}-${p.to}`}
                    from={p.from}
                    to={p.to}
                    comingSoon={!isPairImplemented(p.from, p.to)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
