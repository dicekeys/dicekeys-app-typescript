import React from "react";
import { observer  } from "mobx-react";
import imageOfDiceKeyIcon from /*url:*/"../../images/DiceKey Icon.svg";
import imageOfUsbKey from /*url:*/"../../images/USB Key.svg";
import imageOfSecretWithArrow from /*url:*/"../../images/Secret with Arrow.svg";
import imageOfBackup from /*url:*/"../../images/Backup to DiceKey.svg";
import { Navigation } from "../../state";
import { EventHandlerOverridesDefault } from "../../utilities/EventHandlerOverridesDefault";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import styled from "styled-components";
import { NavigationBar } from "../../views/Navigation/TopNavigationBar";

export const BottomIconNavigationBar = styled(NavigationBar)`
  height: BottomIconBarHeightBottomIconBarHeight;
  background-color: ${props=>props.theme.colors.bottomButtonBarBackground};
  align-items: baseline;
`;

export const FooterButtonDiv = styled.div<{selected: boolean}>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 25vw;
  padding-right: 0;
  padding-left: 0;
  margin-top: 1vh;
  margin-bottom: 1vh;
  cursor: grab;
  user-select: none;
  filter: ${(props) => props.selected ? `invert(100%)` : `none` };
  &:hover {
    filter: invert(75%);
  }
`;

export const FooterIconImg = styled.img`
  display: flex;
  max-height: 5vh;
  flex-basis: 0;
  flex-grow: 1;
`;
const FooterButtonView = observer( ( props: SelectedDiceKeyViewProps & {
  subView: Navigation.SelectedDiceKeySubViews, imageSrc: string, labelStr: string
  onClick: () => void
} ) => (
  <FooterButtonDiv selected={props.state.subView === props.subView}
    onClick={EventHandlerOverridesDefault(props.onClick)}
  ><FooterIconImg src={props.imageSrc}/><div>{props.labelStr}</div>
  </FooterButtonDiv>
));

export const SelectedDiceKeyBottomIconBarView = observer( ( props: SelectedDiceKeyViewProps) => {
  const navState = props.state;
  return (
    <BottomIconNavigationBar>
      <FooterButtonView {...props} labelStr={`DiceKey`} subView={Navigation.SelectedDiceKeySubViews.DisplayDiceKey} imageSrc={imageOfDiceKeyIcon} onClick={navState.navigateToDisplayDiceKey} />
      <FooterButtonView {...props} labelStr={`Seed`} subView={Navigation.SelectedDiceKeySubViews.SeedHardwareKey} imageSrc={imageOfUsbKey} onClick={navState.navigateToSeedHardwareKey} />
      <FooterButtonView {...props} labelStr={`Secret`} subView={Navigation.SelectedDiceKeySubViews.DeriveSecrets} imageSrc={imageOfSecretWithArrow} onClick={navState.navigateToDeriveSecrets} />
      <FooterButtonView {...props} labelStr={`Backup`} subView={Navigation.SelectedDiceKeySubViews.Backup} imageSrc={imageOfBackup} onClick={navState.navigateToBackup} />
    </BottomIconNavigationBar>
  );
});