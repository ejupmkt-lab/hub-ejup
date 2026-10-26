import React from "react";

export interface SelectOption { value: string; label: string; }

/** Labeled select with custom chevron. `options` accepts strings or {value,label}. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: (string | SelectOption)[];
}

export declare function Select(props: SelectProps): JSX.Element;
