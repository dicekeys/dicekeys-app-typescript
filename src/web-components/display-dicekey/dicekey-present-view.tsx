import React from "react";
import ReactDOM from "react-dom";
import {makeAutoObservable} from "mobx";
import { observer  } from "mobx-react";
import { isElectron } from "../../utilities/is-electron";
import { DiceKey } from "../../dicekeys/dicekey";
import { DiceKeyView } from "./dicekey-view";
import css from "./dicekey-present-view.module.css";
import imageOfDiceKeyIcon from "../../images/DiceKey Icon.svg";
import imageOfUsbKey from "../../images/USB Key.svg";
import imageOfSecretWithArrow from "../../images/Secret with Arrow.svg";
import imageOfBackup from "../../images/Backup to DiceKey.svg";

const saveSupported = isElectron() && false; // To support save, investigate https://github.com/atom/node-keytar

enum DiceKeyPresentSubViewSelected {
  Default,
  Display,
  Backup,
  SeedHardwareKey,
  Derive,
//  Save
}

class DiceKeyPresentNavigationState {

  constructor() { makeAutoObservable(this) }

  subView = DiceKeyPresentSubViewSelected.Default;

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

const DiceKeyPresentViewFooter = observer( ( props: DiceKeyPresentProps) => {
  return (
  <div className={css.nav_footer}>
    <div className={css.footer_button}><img className={css.fixed_height_icon} src={imageOfDiceKeyIcon}/><div>DiceKey</div></div>
    <div className={css.footer_button}><img className={css.fixed_height_icon} src={imageOfUsbKey}/><div>SoloKey</div></div>
    <div className={css.footer_button}><img className={css.fixed_height_icon} src={imageOfSecretWithArrow}/><div>Secrets</div></div>
    <div className={css.footer_button}><img className={css.fixed_height_icon} src={imageOfBackup}/>Backup</div>
  </div>
  );
});

export const DiceKeyPresentView = observer( ( props: DiceKeyPresentProps) => {
  return (
    <div className={css.view_top_level}>
      <DiceKeyPresentViewHeader {...props} />
      <div className={css.spacer}/>
      <div className={css.view_content_region}>
        <div className={css.default_view_content}>
          <DiceKeyView diceKey={props.diceKey}/>
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
    ReactDOM.render(<DiceKeyPresentView diceKey={DiceKey.testExample} navigationState={new DiceKeyPresentNavigationState()} />, document.getElementById("app-container"))
}};
