import React from "react";

/** Select dropdown with optional label. `options`: [{value,label}] or strings. */
export function Select({ label, options = [], id, style = {}, ...rest }) {
  const selId = id || (label ? `sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: "var(--font-sans)" }}>
      {label && (
        <label htmlFor={selId} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-heading)" }}>
          {label}
        </label>
      )}
      <select
        id={selId}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: "var(--text-body)",
          padding: "11px 14px",
          background: "#fff",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-sm)",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23031c37' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "38px",
          ...style,
        }}
        {...rest}
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
