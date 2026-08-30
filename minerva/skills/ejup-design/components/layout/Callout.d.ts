import React from "react";

/** Note block with a left accent rule. */
export interface CalloutProps {
  title?: string;
  tone?: "info" | "gold" | "attention";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Callout(props: CalloutProps): JSX.Element;
