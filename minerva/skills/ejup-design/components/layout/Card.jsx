import React from "react";

/** Card — clean surface with restrained elevation. `tone`: light | dark | muted. */
export function Card({ children, tone = "light", elevation = "sm", interactive = false, style = {}, ...rest }) {
  const tones = {
    light: { background: "var(--surface-card)", color: "var(--text-body)", border: "1px solid var(--border-subtle)" },
    dark: { background: "var(--ejup-steel)", color: "var(--text-on-dark)", border: "1px solid rgba(255,255,255,0.08)" },
    muted: { background: "var(--surface-muted)", color: "var(--text-body)", border: "1px solid var(--border-subtle)" },
  };
  const shadows = { none: "none", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)" };
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-5)",
        boxShadow: shadows[elevation],
        transition: "box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)",
        cursor: interactive ? "pointer" : "default",
        ...tones[tone],
        ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.transform = "translateY(-2px)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.boxShadow = shadows[elevation]; e.currentTarget.style.transform = "translateY(0)"; } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
