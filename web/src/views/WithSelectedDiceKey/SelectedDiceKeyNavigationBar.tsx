import { observer } from "mobx-react";
import React from "react";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { addressBarState } from "../../state/core/AddressBarState";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide} from "../Navigation/NavigationLayout";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore, PlatformSupportsSavingToDevice } from "../../state";
import { DiceKeysNavHamburgerMenu, ExpandableMenuProps, HamburgerMenuButton, MenuItem } from "../../views/Navigation/Menu";
import { BooleanState } from "../../state/reusable";

const SelectedDiceKeyExpandableHamburgerMenu = observer( ( {
  state,
  booleanStateTrueIfMenuExpanded
}: SelectedDiceKeyViewProps & ExpandableMenuProps) => {
  const {diceKey} = state;
  if (diceKey == null) return null;

  const isSaved = DiceKeyMemoryStore.hasKeyInEncryptedStore(diceKey.keyId);
  const menuAction = ( actionFn: () => void) => () => {
    booleanStateTrueIfMenuExpanded.set(false);
    actionFn();
  }

  return (<>
    <DiceKeysNavHamburgerMenu {...{booleanStateTrueIfMenuExpanded}}>
      {/* Only show Save/Delete options if the platform supports this functionality */}
      { (!PlatformSupportsSavingToDevice) ? null :
        ( isSaved ?
          (<MenuItem onClick={menuAction(state.navigateToDeleteView)}>{`Delete`}</MenuItem>) :
          (<MenuItem onClick={menuAction(state.navigateToSaveView)}>{`Save`}</MenuItem>)
        )
      }
    </DiceKeysNavHamburgerMenu>
  </>);
});

export const SelectedDiceKeyNavigationBar = observer( ( {
  state,
  goBack
}: SelectedDiceKeyViewProps) => {
  const {diceKey} = state;
  // Make the top left nav bar a button iff we're running in electron,
  // otherwise we're in the browser and this should be a no-op (undefined onClick handler)
  // as the web-based app relies on the back button within the browser.
  // const {saveAndDeleteUIState, foregroundDiceKeyState} = state;
  // const diceKey = foregroundDiceKeyState.diceKey;
  // if (diceKey == null) return null;

  const booleanStateTrueIfMenuExpanded = new BooleanState();

  return (<>
    {
        RUNNING_IN_ELECTRON ? (
          <SelectedDiceKeyExpandableHamburgerMenu state={state} booleanStateTrueIfMenuExpanded={booleanStateTrueIfMenuExpanded} />        
        ) : null 
    }
    <TopNavigationBar>
      <TopNavLeftSide onClick={ goBack ?? addressBarState.back } >{
        RUNNING_IN_ELECTRON ?
          // Show a back button in Electron
          (<>&#8592;</>) :
          // Don't show a back button for the web app, as the browser back button will work.
          (<></>)
        }</TopNavLeftSide>
      <TopNavCenter>{diceKey?.nickname ?? ""}</TopNavCenter>
      <TopNavRightSide >{
        RUNNING_IN_ELECTRON ? (<HamburgerMenuButton {...{booleanStateTrueIfMenuExpanded}}></HamburgerMenuButton>) : null 
      }</TopNavRightSide>
    </TopNavigationBar>
  </>)
});

export const NavigationBarForDiceKey = observer( ( {
  diceKey,
  goBack
}: {diceKey: DiceKeyWithKeyId, goBack: () => any}) => {
  return (
    <TopNavigationBar>
      <TopNavLeftSide onClick={ goBack } >{
        RUNNING_IN_ELECTRON ?
          // Show a back button in Electron
          (<>&#8592;</>) :
          // Don't show a back button for the web app, as the browser back button will work.
          (<></>)
        }</TopNavLeftSide>
      <TopNavCenter>{diceKey?.nickname ?? ""}</TopNavCenter>
      <TopNavRightSide></TopNavRightSide>
    </TopNavigationBar>
  )
});