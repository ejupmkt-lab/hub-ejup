import React from "react";

/** Eyebrow — wide-tracked uppercase label, a signature EJUP device. */
export function Eyebrow({ children, tone = "gold", style = {}, ...rest }) {
  const tones = {
    gold: "var(--accent)",
    navy: "var(--ejup-navy)",
    muted: "var(--text-muted)",
    onDark: "var(--text-on-dark-muted)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "var(--ls-caps)",
        textTransform: "uppercase",
        color: tones[tone] || tones.gold,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
