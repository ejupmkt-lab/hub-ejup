import React from "react";

export interface TabItem { value: string; label: string; }

/** Underline tabs with a gold active indicator (controlled). */
export interface TabsProps {
  tabs: (string | TabItem)[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

export declare function Tabs(props: TabsProps): JSX.Element;
