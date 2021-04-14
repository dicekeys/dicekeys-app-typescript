import {SpecialTags} from "../../css";
import React from "react";

export const CharButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={SpecialTags.CharButton} {...props}/>
);

export const CharButtonToolTip = (props: React.PropsWithChildren<{}>) => (
  <span className={SpecialTags.CharButtonToolTip}>{props.children}</span>
)