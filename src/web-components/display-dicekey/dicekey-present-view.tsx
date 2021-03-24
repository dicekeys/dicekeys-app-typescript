import css from "./dicekey-present-view.module.css";
import React from "react";
import ReactDOM from "react-dom";
import {makeAutoObservable} from "mobx";
import { observer  } from "mobx-react";
import { isElectron } from "../../utilities/is-electron";
import { DiceKey } from "../../dicekeys/dicekey";
import { DiceKeyView } from "./dicekey-view";
import imageOfDiceKeyIcon from "../../images/DiceKey Icon.svg";
import imageOfUsbKey from "../../images/USB Key.svg";
import imageOfSecretWithArrow from "../../images/Secret with Arrow.svg";
import imageOfBackup from "../../images/Backup to DiceKey.svg";
import { DerivationView, DerivationViewState } from "./derivation-view";

const saveSupported = isElectron() && false; // To support save, investigate https://github.com/atom/node-keytar

enum DiceKeyPresentSubViewSelected {
  Display,
  Backup,
  SeedHardwareKey,
  Derive,
//  Save
}

class DiceKeyPresentNavigationState {

  constructor(
    initialSubView: DiceKeyPresentSubViewSelected = DiceKeyPresentSubViewSelected.Display
  ) {
    this.subView = initialSubView;
    makeAutoObservable(this)
  }

  subView: DiceKeyPresentSubViewSelected;

  navigateTo = (dest: DiceKeyPresentSubViewSelected) => {
    this.subView = dest;
  }
}

interface DiceKeyPresentProps {
  diceKey: DiceKey;
  navigationState: DiceKeyPresentNavigationState;
}

const DiceKeyPresentViewHeader = observer( ( props: DiceKeyPresentProps) => {
  return (
    <div className={css.nav_header}>
      <span className={css.nav_side}>&#8592;</span>
      <span className={css.nav_center}>{DiceKey.nickname(props.diceKey)}</span>
      <span className={css.nav_side}></span>
    </div>
  );
});

const FooterButtonView = observer( ( props: DiceKeyPresentProps & {subView: DiceKeyPresentSubViewSelected, imageSrc: string, labelStr: string} ) => (
  <div
    className={props.navigationState.subView == props.subView ? css.footer_button_selected : css.footer_button}
    onClick={() => props.navigationState.navigateTo(props.subView)}
  ><img className={css.footer_icon} src={props.imageSrc}/><div>{props.labelStr}</div></div>
));

const DiceKeyPresentViewFooter = observer( ( props: DiceKeyPresentProps) => (
  <div className={css.nav_footer}>
    <FooterButtonView {...props} labelStr={`DiceKey`} subView={DiceKeyPresentSubViewSelected.Display} imageSrc={imageOfDiceKeyIcon}/>
    <FooterButtonView {...props} labelStr={`SoloKey`} subView={DiceKeyPresentSubViewSelected.SeedHardwareKey} imageSrc={imageOfUsbKey}/>
    <FooterButtonView {...props} labelStr={`Secret`} subView={DiceKeyPresentSubViewSelected.Derive} imageSrc={imageOfSecretWithArrow}/>
    <FooterButtonView {...props} labelStr={`Backup`} subView={DiceKeyPresentSubViewSelected.Backup} imageSrc={imageOfBackup}/>
  </div>
));

export const DiceKeyPresentView = observer( ( props: DiceKeyPresentProps) => {
  return (
    <div className={css.view_top_level}>
      <DiceKeyPresentViewHeader {...props} />
      <div className={css.spacer}/>
      <div className={css.view_content_region}>
        <div className={css.default_view_content}>
          {(() => {
            switch(props.navigationState.subView) {
              case DiceKeyPresentSubViewSelected.Display: return (
                <DiceKeyView diceKey={props.diceKey}/>
              );
              case DiceKeyPresentSubViewSelected.Derive: return (
                <DerivationView derivationViewState={new DerivationViewState()} />
              );
              default: return null;
            }
          })()}
        </div>
      </div>
      <div className={css.spacer}/>
      <DiceKeyPresentViewFooter {...props} />
    </div>
  );
});

(window as {testComponent?: {}}).testComponent = {
  ...((window as {testComponent?: {}}).testComponent ?? {}),
  DiceKeyPresentView: () => {
    ReactDOM.render(<DiceKeyPresentView diceKey={DiceKey.testExample} navigationState={new DiceKeyPresentNavigationState(DiceKeyPresentSubViewSelected.Derive)} />, document.getElementById("app-container"))
}};
