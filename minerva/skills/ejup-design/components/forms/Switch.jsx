import React from "react";

/** Switch toggle. Controlled via `checked` + `onChange(boolean)`. */
export function Switch({ checked = false, onChange, label, disabled = false, style = {}, ...rest }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        color: "var(--text-body)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--ejup-navy)" : "var(--border-strong)",
          position: "relative",
          transition: "background var(--dur-base) var(--ease-standard)",
          flexShrink: 0,
        }}
        {...rest}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
            transition: "left var(--dur-base) var(--ease-out)",
          }}
        />
      </span>
      {label}
    </label>
  );
}
