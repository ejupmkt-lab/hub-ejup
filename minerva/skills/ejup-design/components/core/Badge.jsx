import React from "react";

/** Badge / Tag — small status or category label. */
export function Badge({ children, variant = "neutral", style = {}, ...rest }) {
  const variants = {
    neutral: { background: "var(--surface-muted)", color: "var(--text-body)", border: "1px solid var(--border-subtle)" },
    navy: { background: "var(--ejup-navy)", color: "#fff", border: "1px solid var(--ejup-navy)" },
    gold: { background: "rgba(240,184,85,0.16)", color: "var(--ejup-bronze)", border: "1px solid rgba(240,184,85,0.5)" },
    bronze: { background: "rgba(155,107,38,0.12)", color: "var(--ejup-bronze)", border: "1px solid rgba(155,107,38,0.45)" },
    steel: { background: "rgba(48,69,87,0.12)", color: "var(--ejup-steel)", border: "1px solid rgba(48,69,87,0.4)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-sans)",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
