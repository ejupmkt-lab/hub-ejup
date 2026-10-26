import React from "react";

/** Square icon-only button. Provide an icon node as children and an a11y `label`. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "navy" | "gold";
  size?: number;
  label?: string;
  children?: React.ReactNode;
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
