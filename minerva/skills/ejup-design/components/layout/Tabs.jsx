import React from "react";

/** Tabs — underline style with gold active indicator. */
export function Tabs({ tabs = [], value, onChange, style = {} }) {
  const items = tabs.map((t) => (typeof t === "string" ? { value: t, label: t } : t));
  const active = value ?? items[0]?.value;
  return (
    <div style={{ display: "flex", gap: "28px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", ...style }}>
      {items.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange && onChange(t.value)}
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: on ? 700 : 500,
              color: on ? "var(--ejup-navy)" : "var(--text-muted)",
              borderBottom: `2px solid ${on ? "var(--accent)" : "transparent"}`,
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "color var(--dur-base) var(--ease-standard)",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
