import React from "react";

/** Circular avatar — image, or auto-initials from `name`. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string | null;
  size?: number;
}

export declare function Avatar(props: AvatarProps): JSX.Element;
