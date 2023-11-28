import React from "react";
import { electronBridge } from "../../state/core/ElectronBridge";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

/** A link to an external website */
export const ExternalLink = ({children, url}: React.PropsWithChildren<{url: string}>) => {
  if (RUNNING_IN_ELECTRON) {
    const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      electronBridge.openLinkInBrowser(url);
    }
    return (<a onClick={onClick} href={url}>{children}</a>);
  } else {
    return (<a target="_blank" href={url}>{children}</a>);
  }
}

export const StoreLink = ({children}: React.PropsWithChildren) =>
  (<ExternalLink url="https://dicekeys.app/store">{children}</ExternalLink>);