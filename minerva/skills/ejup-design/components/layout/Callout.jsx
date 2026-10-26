import React from "react";

/** Callout — bordered note with a left gold rule. tone: info | gold | success | danger. */
export function Callout({ children, title, tone = "info", style = {} }) {
  const tones = {
    info: { rule: "var(--ejup-steel)", bg: "var(--surface-muted)" },
    gold: { rule: "var(--accent)", bg: "rgba(240,184,85,0.08)" },
    attention: { rule: "var(--ejup-bronze)", bg: "rgba(155,107,38,0.07)" },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        background: t.bg,
        borderLeft: `3px solid ${t.rule}`,
        borderRadius: "var(--radius-sm)",
        padding: "14px 18px",
        ...style,
      }}
    >
      {title && (
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "4px" }}>{title}</div>
      )}
      <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-body)" }}>{children}</div>
    </div>
  );
}
