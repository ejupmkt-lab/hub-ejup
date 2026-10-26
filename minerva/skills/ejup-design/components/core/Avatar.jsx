import React from "react";

/** Avatar — initials or image, institutional circle. */
export function Avatar({ name = "", src = null, size = 40, style = {}, ...rest }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--radius-pill)",
        background: "var(--ejup-steel)",
        color: "#fff",
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </span>
  );
}
