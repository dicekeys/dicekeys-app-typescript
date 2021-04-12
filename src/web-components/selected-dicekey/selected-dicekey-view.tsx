import css from "./selected-dicekey-view.module.css";
import React from "react";
import ReactDOM from "react-dom";
import { observer  } from "mobx-react";
//import { isElectron } from "../../utilities/is-electron";
import { DiceKey } from "../../dicekeys/dicekey";
import { DiceKeyView } from "./DiceKeyView";
import imageOfDiceKeyIcon from "../../images/DiceKey Icon.svg";
import imageOfUsbKey from "../../images/USB Key.svg";
import imageOfSecretWithArrow from "../../images/Secret with Arrow.svg";
import imageOfBackup from "../../images/Backup to DiceKey.svg";
import { DerivationView } from "./derivation-view";
import { Navigation } from "../../state";
const SubViews = Navigation.SelectedDiceKeySubViews

// const saveSupported = isElectron() && false; // To support save, investigate https://github.com/atom/node-keytar

interface SelectedDiceKeyViewProps {
  onBack: () => any;
  navigationState: Navigation.SelectedDiceKeyViewState;
}

const SelectedDiceKeyViewHeader = observer( ( props: SelectedDiceKeyViewProps) => {
  const diceKey = props.navigationState.diceKey;
  if (!diceKey) return null;
  return (
    <div className={css.nav_header}>
      <span className={css.nav_side} onClick={ props.onBack } >&#8592;</span>
      <span className={css.nav_center}>{DiceKey.nickname(diceKey)}</span>
      <span className={css.nav_side}></span>
    </div>
  );
});

const FooterButtonView = observer( ( props: SelectedDiceKeyViewProps & {
  subView: Navigation.SelectedDiceKeySubViews, imageSrc: string, labelStr: string
  onClick: () => void
} ) => (
  <div
    className={props.navigationState.subView === props.subView ? css.footer_button_selected : css.footer_button}
    onClick={(e) => { props.onClick(); e.preventDefault(); }}
  ><img className={css.footer_icon} src={props.imageSrc}/><div>{props.labelStr}</div></div>
));

const SelectedDiceKeyViewStateFooter = observer( ( props: SelectedDiceKeyViewProps) => {
  const navState = props.navigationState;
  return (
  <div className={css.nav_footer}>
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
      <SelectedDiceKeyViewHeader {...props} />
      <div className={css.spacer}/>
      <div className={css.view_content_region}>
        <div className={css.default_view_content}>
          {(() => {
            switch(props.navigationState.subView) {
              case Navigation.SelectedDiceKeySubViews.DisplayDiceKey: return (
                <DiceKeyView diceKey={diceKey}/>
              );
              case Navigation.SelectedDiceKeySubViews.DeriveSecrets: return (
                <DerivationView seedString={DiceKey.toSeedString(diceKey, true)} />
              );
              default: return null;
            }
          })()}
        </div>
      </div>
      <div className={css.spacer}/>
      <SelectedDiceKeyViewStateFooter {...props} />
    </div>
  );
});

(window as {testComponent?: {}}).testComponent = {
  ...((window as {testComponent?: {}}).testComponent ?? {}),
  SelectedDiceKeyViewState: async () => {
    ReactDOM.render(<SelectedDiceKeyView onBack={ () => alert("Get back!" ) }
      navigationState={new Navigation.SelectedDiceKeyViewState( () => {}, (await DiceKey.keyId(DiceKey.testExample)), Navigation.SelectedDiceKeySubViews.DeriveSecrets)}
    />, document.getElementById("app-container"))
}};
