import React from "react";

/** Labeled checkbox (controlled). */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export declare function Checkbox(props: CheckboxProps): JSX.Element;
