import React from "react";

/** IconButton — square, icon-only action. Pass a Lucide (or any) icon node. */
export function IconButton({ children, variant = "ghost", size = 40, label, style = {}, ...rest }) {
  const variants = {
    ghost: { background: "transparent", color: "var(--ejup-navy)", border: "1px solid transparent" },
    outline: { background: "transparent", color: "var(--ejup-navy)", border: "1px solid var(--border-strong)" },
    navy: { background: "var(--ejup-navy)", color: "#fff", border: "1px solid var(--ejup-navy)" },
    gold: { background: "var(--accent)", color: "var(--ejup-navy)", border: "1px solid var(--accent)" },
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "background var(--dur-base) var(--ease-standard)",
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
