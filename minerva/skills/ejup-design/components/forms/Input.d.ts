import React from "react";

/** Labeled text input with helper / error states. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export declare function Input(props: InputProps): JSX.Element;
