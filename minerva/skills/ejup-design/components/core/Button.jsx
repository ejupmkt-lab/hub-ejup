import React from "react";

/**
 * EJUP Button — institutional, restrained.
 * Variants: primary (navy), gold (accent CTA), secondary (steel outline), ghost.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: "8px 16px", fontSize: "13px" },
    md: { padding: "12px 24px", fontSize: "14px" },
    lg: { padding: "16px 32px", fontSize: "16px" },
  };

  const variants = {
    primary: {
      background: "var(--ejup-navy)",
      color: "var(--text-on-dark)",
      border: "1px solid var(--ejup-navy)",
    },
    gold: {
      background: "var(--accent)",
      color: "var(--ejup-navy)",
      border: "1px solid var(--accent)",
      boxShadow: "var(--shadow-gold)",
    },
    secondary: {
      background: "transparent",
      color: "var(--ejup-navy)",
      border: "1px solid var(--border-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ejup-navy)",
      border: "1px solid transparent",
    },
  };

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    letterSpacing: "0.02em",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "background var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)",
    whiteSpace: "nowrap",
    ...sizes[size],
    ...variants[variant],
    ...style,
  };

  const onDown = (e) => { if (!disabled) e.currentTarget.style.transform = "translateY(1px)"; };
  const onUp = (e) => { e.currentTarget.style.transform = "translateY(0)"; };

  return (
    <button
      type="button"
      disabled={disabled}
      style={base}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
