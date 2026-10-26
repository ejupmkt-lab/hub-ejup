import React from "react";

/**
 * Wide-tracked uppercase eyebrow label — a signature EJUP typographic device,
 * used above headlines and as section markers ("COLEÇÃO INSTITUCIONAL · 01").
 */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "gold" | "navy" | "muted" | "onDark";
  children?: React.ReactNode;
}

export declare function Eyebrow(props: EyebrowProps): JSX.Element;
