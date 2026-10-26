import React from "react";

/** Small pill label for status or category. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "navy" | "gold" | "bronze" | "steel";
  children?: React.ReactNode;
}

export declare function Badge(props: BadgeProps): JSX.Element;
