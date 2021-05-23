import css from "./selected-dicekey-view.module.css";
import {NavigationBars} from "../../css"
import React, { useEffect, useState } from "react";
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
import { BackupState, BackupView } from "../BackupView";
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

export const SelectedDiceKeyView = observer( ( props: SelectedDiceKeyViewProps) => {
  const diceKey = props.navigationState.diceKey;
  if (!diceKey) return null;
  return (
    <div className={css.view_top_level}>
      <SimpleTopNavBar title={diceKey.nickname} goBack={props.navigationState.goBack} />
      <div className={NavigationBars.BetweenTopAndBottomNavigationBars}>
        <div className={css.view_content_region}>
          <div className={css.default_view_content}>
            {(() => {
              switch(props.navigationState.subView) {
                case Navigation.SelectedDiceKeySubViews.DisplayDiceKey: return (
                  <DiceKeyViewAutoSized faces={diceKey.faces}/>
                );
                case Navigation.SelectedDiceKeySubViews.DeriveSecrets: return (
                  <DerivationView seedString={diceKey.toSeedString()} />
                );
                case Navigation.SelectedDiceKeySubViews.SeedHardwareKey: return (
                  <SeedHardwareKeyView diceKey={diceKey} seedHardwareKeyViewState={ new SeedHardwareKeyViewState(diceKey.toSeedString()) } />
                );
                case Navigation.SelectedDiceKeySubViews.Backup: return (
                  <BackupView state={new BackupState(diceKey)} />
                );
                default: return null;
              }
            })()}
          </div>
        </div>
      </div>
      <SelectedDiceKeyViewStateFooter {...props} />
    </div>
  );
});


export const Preview_SelectedDiceKeyView = () => {
  const [navigationState, setNavigationState] = useState<Navigation.SelectedDiceKeyViewState | undefined>();
  useEffect( () => {
    if (!navigationState) {
      Navigation.SelectedDiceKeyViewState.create(
        () => alert("Back off man, I'm a scientist!"),
        DiceKey.testExample
      ).then( navState => setNavigationState(navState) )
    }})
  if (navigationState == null) return null;
  return (
    <SelectedDiceKeyView navigationState={navigationState} />
  );
};
