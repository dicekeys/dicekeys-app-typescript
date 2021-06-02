import React from "react"

export const visibility = (visible: boolean, otherStyles: React.CSSProperties = {}): React.CSSProperties =>
  visible ? otherStyles : {...otherStyles, visibility: "hidden"};
