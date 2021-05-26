import layoutCSS from "../../css/Layout.module.css";
import {NavigationBars} from "../../css"
import React from "react";
import { observer  } from "mobx-react";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import imageOfDiceKeyIcon from /*url:*/"../../images/DiceKey Icon.svg";
import imageOfUsbKey from /*url:*/"../../images/USB Key.svg";
import imageOfSecretWithArrow from /*url:*/"../../images/Secret with Arrow.svg";
import imageOfBackup from /*url:*/"../../images/Backup to DiceKey.svg";
import { DerivationView } from "../Recipes/DerivationView";
import { Navigation } from "../../state";
import { SeedHardwareKeyView, SeedHardwareKeyViewState } from "./SeedHardwareKeyView";
import { SimpleTopNavBar } from "../Navigation/SimpleTopNavBar";
import { BackupState, BackupView } from "../BackupView/BackupView";
import { ForegroundDiceKeyState } from "../../state/navigation/ForegroundDiceKeyState";
const SubViews = Navigation.SelectedDiceKeySubViews

// const saveSupported = isElectron() && false; // To support save, investigate https://github.com/atom/node-keytar

interface SelectedDiceKeyViewProps {
  navigationState: Navigation.SelectedDiceKeyViewState;
}

const FooterButtonView = observer( ( props: SelectedDiceKeyViewProps & {
  subView: Navigation.SelectedDiceKeySubViews, imageSrc: string, labelStr: string
  onClick: () => void
} ) => (
  <div
    className={props.navigationState.subView === props.subView ? NavigationBars.footer_button_selected : NavigationBars.footer_button}
    onClick={(e) => { props.onClick(); e.preventDefault(); }}
  ><img className={NavigationBars.footer_icon} src={props.imageSrc}/><div>{props.labelStr}</div></div>
));

const SelectedDiceKeyViewStateFooter = observer( ( props: SelectedDiceKeyViewProps) => {
  const navState = props.navigationState;
  return (
  <div className={NavigationBars.BottomNavigationBar}>
    <FooterButtonView {...props} labelStr={`DiceKey`} subView={SubViews.DisplayDiceKey} imageSrc={imageOfDiceKeyIcon} onClick={navState.navigateToDisplayDiceKey} />
    <FooterButtonView {...props} labelStr={`SoloKey`} subView={SubViews.SeedHardwareKey} imageSrc={imageOfUsbKey} onClick={navState.navigateToSeedHardwareKey} />
    <FooterButtonView {...props} labelStr={`Secret`} subView={SubViews.DeriveSecrets} imageSrc={imageOfSecretWithArrow} onClick={navState.navigateToDeriveSecrets} />
    <FooterButtonView {...props} labelStr={`Backup`} subView={SubViews.Backup} imageSrc={imageOfBackup} onClick={navState.navigateToBackup} />
  </div>
  );
});

const SelectedDiceKeySubViewSwitch = observer( ( props: SelectedDiceKeyViewProps & {backupState: BackupState}) => {
  const diceKey = props.navigationState.foregroundDiceKeyState.diceKey;
  if (!diceKey) return null;
  switch(props.navigationState.subView) {
    case Navigation.SelectedDiceKeySubViews.DisplayDiceKey: return (
      <DiceKeyViewAutoSized maxWidth="80vw" maxHeight="70vh" faces={diceKey.faces}/>
    );
    case Navigation.SelectedDiceKeySubViews.DeriveSecrets: return (
      <DerivationView seedString={diceKey.toSeedString()} />
    );
    case Navigation.SelectedDiceKeySubViews.SeedHardwareKey: return (
      <SeedHardwareKeyView diceKey={diceKey} seedHardwareKeyViewState={ new SeedHardwareKeyViewState(diceKey.toSeedString()) } />
    );
    case Navigation.SelectedDiceKeySubViews.Backup: return (
      <BackupView state={props.backupState} nextStepAfterEnd={() => {
        props.backupState.clear();
        props.navigationState.navigateToDisplayDiceKey();
      }} />
    );
    default: return null;
  }
});

export const SelectedDiceKeyView = observer( ( props: SelectedDiceKeyViewProps) => {
  const diceKey = props.navigationState.foregroundDiceKeyState.diceKey;
  if (!diceKey) return null;
  const backupState = new BackupState(props.navigationState.foregroundDiceKeyState);
  return (
    <div className={layoutCSS.HeaderFooterContentBox}>
      <SimpleTopNavBar title={diceKey.nickname} goBack={props.navigationState.goBack} />
      {/* <div className={layoutCSS.PaddedContentBox}> */}
      <div className={NavigationBars.BetweenTopAndBottomNavigationBars}>
        <SelectedDiceKeySubViewSwitch {...{...props, backupState}} />
      </div>
      <SelectedDiceKeyViewStateFooter {...props} />
    </div>
  );
});


export const Preview_SelectedDiceKeyView = observer ( () => {
  return (
    <SelectedDiceKeyView navigationState={
      new Navigation.SelectedDiceKeyViewState(
        () => alert("Back off man, I'm a scientist!"),
        new ForegroundDiceKeyState(DiceKey.testExample)
      )
    } />
  );
});
