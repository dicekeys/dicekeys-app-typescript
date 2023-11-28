import { observer } from "mobx-react";
import React, { PropsWithChildren } from "react";
import {
  Clickable,
  TopNavRightPopUpMenu} from "./NavigationLayout";
// import { BUILD_VERSION, BUILD_DATE } from "../../vite-build-constants";
import { BooleanState } from "../../state/reusable/BooleanState";
import styled from "styled-components";

export const MenuItem = styled.div`
  cursor: grab;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: baseline;
  border-top-color: ${ props => props.theme.colors.navigationBarForeground };
  border-top-style: dotted;
  border-top-width: 1px;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 1rem;
  padding-right: 1rem;
  font-size: 1rem;
  user-select: none;
  &:hover {
    color: ${ props => (props.onClick != null) ? props.theme.colors.background : props.theme.colors.navigationBarForeground }
  }
`;

export const MenuItemDisplayOnlyContent = styled.div`
  font-style: italic;
  text-align: left;
  font-size: 0.8rem;
`

export interface ExpandableMenuProps {
  booleanStateTrueIfMenuExpanded: BooleanState
}

export const ExpandableMenu = observer ( ({children, booleanStateTrueIfMenuExpanded, ...props}: PropsWithChildren<ExpandableMenuProps>) => (
  <TopNavRightPopUpMenu $isOpen={booleanStateTrueIfMenuExpanded.value} {...props}>{children}</TopNavRightPopUpMenu>
));

export const HamburgerMenuButton = ({booleanStateTrueIfMenuExpanded}: ExpandableMenuProps) => (
  <Clickable
    style={{fontSize: `6vh`}}
    onClick={ booleanStateTrueIfMenuExpanded.toggle }
  >
  &#8801;
</Clickable>
)

export const DiceKeysNavHamburgerMenu = ({children, ...props}: PropsWithChildren<ExpandableMenuProps>) => (
  <ExpandableMenu {...props}>
    {children}
    {/* <MenuItem><MenuItemDisplayOnlyContent>Version {BUILD_VERSION}<br/>{BUILD_DATE}</MenuItemDisplayOnlyContent></MenuItem> */}
  </ExpandableMenu>
);