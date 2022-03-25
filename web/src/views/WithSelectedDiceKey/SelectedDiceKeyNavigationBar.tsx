import { observer } from "mobx-react";
import React from "react";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { addressBarState } from "../../state/core/AddressBarState";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide} from "../Navigation/NavigationLayout";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";

// const SelectedDiceKeyExpandableHamburgerMenu = observer( ( {
//   state,
//   booleanStateTrueIfMenuExpanded
// }: SelectedDiceKeyViewProps & ExpandableMenuProps) => {
//   const {diceKey} = state;
//   if (diceKey == null) return null;

//   const isSaved = EncryptedDiceKeyStore.has(diceKey);

//   return (<>
//     {/* <DiceKeysNavHamburgerMenu {...{booleanStateTrueIfMenuExpanded}}>
//       <MenuItem onClick={state.saveAndDeleteUIState.toggleShowSaveDeleteModal}>{ isSaved ? `Delete` : `Save`}</MenuItem>
//     </DiceKeysNavHamburgerMenu> */}
//   </>);
// });

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

  // const booleanStateTrueIfMenuExpanded = new BooleanState();

  return (<>
    {/* {
        RUNNING_IN_ELECTRON ? (<>
          <SelectedDiceKeyExpandableHamburgerMenu {...{booleanStateTrueIfMenuExpanded, state, goBack}} />        
          <ModalOverlayForDialogOrMessage invisible={!saveAndDeleteUIState.showSaveDeleteModal || !saveAndDeleteUIState.isSaved}>
            <Spacer />
            <Instruction>
             Are you sure you want to remove <DiceKeyNickname {...{diceKey}}/> from this device?
            </Instruction>
            <CenteredControls>
              <OptionButton onClick={saveAndDeleteUIState.setShowSaveDeleteModalFn(false)}>Cancel</OptionButton>
              <OptionButton onClick={saveAndDeleteUIState.handleOnSaveDeleteButtonClicked}>{ saveAndDeleteUIState.isSaved ? `Delete` : `Save`}</OptionButton>  
            </CenteredControls>
            <Spacer/>
          </ModalOverlayForDialogOrMessage>
          <ModalOverlayForDialogOrMessage invisible={!saveAndDeleteUIState.showSaveDeleteModal || saveAndDeleteUIState.isSaved}>
            <Spacer/>
            <Instruction>
              If you save <DiceKeyNickname {...{diceKey}}/> on this device, anyone able to access your account on this device, or any
              app that can run on this device, may be able to access the DiceKey. 
            </Instruction>
            <CenteredControls>
              <OptionButton onClick={saveAndDeleteUIState.setShowSaveDeleteModalFn(false)}>Cancel</OptionButton>
              <OptionButton onClick={saveAndDeleteUIState.handleOnSaveDeleteButtonClicked}>{ saveAndDeleteUIState.isSaved ? `Delete` : `Save`}</OptionButton>  
            </CenteredControls>
            <Spacer/>
          </ModalOverlayForDialogOrMessage>
              </>) : null 
    } */}
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
        // RUNNING_IN_ELECTRON ? (<HamburgerMenuButton {...{booleanStateTrueIfMenuExpanded}}></HamburgerMenuButton>) : null 
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