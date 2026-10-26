import React from "react";

/** Checkbox with label. Controlled via `checked` + `onChange`. */
export function Checkbox({ label, checked = false, onChange, id, style = {}, ...rest }) {
  const cbId = id || (label ? `cb-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <label
      htmlFor={cbId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        color: "var(--text-body)",
        cursor: "pointer",
        ...style,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "var(--radius-xs)",
          border: `1px solid ${checked ? "var(--ejup-navy)" : "var(--border-strong)"}`,
          background: checked ? "var(--ejup-navy)" : "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--dur-fast) var(--ease-standard)",
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <input id={cbId} type="checkbox" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} {...rest} />
      {label}
    </label>
  );
}
