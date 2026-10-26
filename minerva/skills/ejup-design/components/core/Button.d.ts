import React from "react";

export type ButtonVariant = "primary" | "gold" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Institutional button for EJUP. Use `primary` (navy) for the main action,
 * `gold` for a single high-emphasis CTA, `secondary` for outlined alternatives,
 * `ghost` for low-emphasis inline actions.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export declare function Button(props: ButtonProps): JSX.Element;
