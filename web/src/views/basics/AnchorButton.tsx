import React from "react";

export const AnchorButton = ({onClick, ...props}: React.ComponentPropsWithRef<'a'>) => {
  const replacementOnClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event?.preventDefault();
    return onClick?.(event);
  }
  return <a {...{href: "#", ...props, onClick: replacementOnClick}} />
}