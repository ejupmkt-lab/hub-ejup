import React from "react";

/**
 * Surface card with restrained elevation. `dark` tone renders a steel-blue panel
 * for institutional/hero contexts.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "light" | "dark" | "muted";
  elevation?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  children?: React.ReactNode;
}

export declare function Card(props: CardProps): JSX.Element;
