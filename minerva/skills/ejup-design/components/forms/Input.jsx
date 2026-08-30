import React from "react";

/** Text input with optional label and helper/error text. */
export function Input({ label, helper, error, id, style = {}, ...rest }) {
  const inputId = id || (label ? `in-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: "var(--font-sans)" }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-heading)" }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: "var(--text-body)",
          padding: "11px 14px",
          background: "#fff",
          border: `1px solid ${error ? "var(--state-attention)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          transition: "border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)",
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--ejup-navy)";
          e.target.style.boxShadow = "0 0 0 3px rgba(3,28,55,0.08)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "var(--state-attention)" : "var(--border-strong)";
          e.target.style.boxShadow = "none";
        }}
        {...rest}
      />
      {(helper || error) && (
        <span style={{ fontSize: "12px", color: error ? "var(--state-attention)" : "var(--text-muted)" }}>
          {error || helper}
        </span>
      )}
    </div>
  );
}
