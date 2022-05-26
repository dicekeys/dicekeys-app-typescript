import { observer } from "mobx-react";
import React from "react";

import styled, { css } from "styled-components";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { cssCalcTyped } from "../utilities";
import { DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId, facesFromPublicKeyDescriptor } from "../dicekeys/DiceKey";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state";
// import { SubViewButton } from "../css/SubViewButton";
// import { ButtonRow, PushButton } from "../css/Button";
// import { ObscureDiceKey } from "../state/ToggleState";

const keyRowWidth = `90vw` as const;
const selectedItemSize = `min(40vw, 50vh)` as const;
const unselectedItemSize = `(${selectedItemSize} / 2)` as const;
const spaceBetweenItems = `min(2vw, 2vh)` as const;
const unselectedItemSizeWithMargins = `(${unselectedItemSize} + ${spaceBetweenItems})` as const;
export const keyMargin = `( (${spaceBetweenItems}) / 2 )` as const;


interface SpacingInformation {
  indexSelected: number;
  numberOfElements: number;
}

const WidthSpacer = styled.div<{width: string}>`
  display: block;
  min-width: ${ p => p.width };
  min-height: 1px;
`

const paddingRequiredToCenterOneEdge = (numberOfElementsBetweenItemAndEdge: number) => {
  const paddingRequiredIfNoObjectsToLeft = `( (${keyRowWidth} - (${selectedItemSize} + ${spaceBetweenItems}) ) / 2)` as const;  
  const paddingRequireAccountingForToLeft = `${paddingRequiredIfNoObjectsToLeft} - (${numberOfElementsBetweenItemAndEdge} * ${unselectedItemSizeWithMargins})` as const;
  const neverLessThanZero = `max(0px,${paddingRequireAccountingForToLeft})` as const;
  const padding = `calc(${neverLessThanZero})` as const;
  return padding;
}


const StoredDiceKeysRow = styled.div<SpacingInformation>`
  ${ ({indexSelected, numberOfElements}) => (indexSelected < 0) ? css`` : 
    css`
      box-sizing: border-box;
      padding-right: ${paddingRequiredToCenterOneEdge(numberOfElements - (indexSelected + 1))};
      padding-left: ${paddingRequiredToCenterOneEdge(indexSelected)};
  `}
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  max-width: ${keyRowWidth};
  overflow-x: auto;
`

const StoredDiceKeyViewContainer = styled.div`
  display: block;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin-left: calc(${keyMargin});
  margin-right: calc(${keyMargin});
`;

interface StoredDiceKeyProps {
  storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice;
  onClick: () => void
}

const SelectableDiceKeyView = observer ( (props: StoredDiceKeyProps) => {
  const {storedDiceKeyDescriptor, onClick} = props;
  return (
    <StoredDiceKeyViewContainer
      key={storedDiceKeyDescriptor.keyId}
    >
      <DiceKeyView
        onClick={onClick}
        size={`${cssCalcTyped(unselectedItemSize)}`}
        faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
        obscureAllButCenterDie={true}
        showLidTab={true}
      />
    </StoredDiceKeyViewContainer>
  )
});


const SelectedDiceKeyView = observer ( (props: {diceKey?: DiceKeyWithKeyId}) => {
  const {diceKey} = props;
  if (diceKey == null) return null;
  return (
    <StoredDiceKeyViewContainer
      key={diceKey.keyId}
      // Automatically scroll selected DiceKeys into the center.
      ref={ (e) => {
          if (e == null) return;
          e.scrollIntoView({inline: "center", block: "center"})
       }}
    >
        <DiceKeyView
          size={`${cssCalcTyped(selectedItemSize)}`}
          faces={ diceKey.faces }
          // obscureAllButCenterDie={true}
          showLidTab={false}
        />
    </StoredDiceKeyViewContainer>
  )
});


interface DiceKeySelectorViewProps {
  selectedDiceKeyId: string | undefined;
  setSelectedDiceKeyId: (newKeyId: string | undefined) => void;
}
export const DiceKeySelectorView = observer ( ({selectedDiceKeyId, setSelectedDiceKeyId}: DiceKeySelectorViewProps) => {
  const storedDiceKeyDescriptors = DiceKeyMemoryStore.keysInMemoryOrSavedToDevice;
  const indexSelected = storedDiceKeyDescriptors.findIndex( descriptor => descriptor.keyId === selectedDiceKeyId );
  const selectDiceKey = (keyId: string) => () => {
    setSelectedDiceKeyId(keyId);
  }
  const numberOfElements = storedDiceKeyDescriptors.length;
  // const paddingLeft = paddingRequiredToCenterOneEdge(indexSelected);
  // const paddingRight = paddingRequiredToCenterOneEdge(numberOfElements - (indexSelected + 1));
  return (
    <StoredDiceKeysRow indexSelected={indexSelected} numberOfElements={storedDiceKeyDescriptors.length}>
      {/* <WidthSpacer width={paddingLeft}></WidthSpacer> */}
      {
      storedDiceKeyDescriptors.map( (storedDiceKeyDescriptor) => {
        const isSelected = storedDiceKeyDescriptor.keyId === selectedDiceKeyId;
        return isSelected ? (
          <SelectedDiceKeyView
            diceKey={DiceKeyMemoryStore.diceKeyForKeyId(storedDiceKeyDescriptor.keyId)}
            key={storedDiceKeyDescriptor.keyId}
            // {...{storedDiceKeyDescriptor, isSelected}}
            // onClick={() => {alert("toggle"); ObscureDiceKey.toggle() }}
          />
          ) : (
          <SelectableDiceKeyView
            key={storedDiceKeyDescriptor.keyId} {...{storedDiceKeyDescriptor}}
            onClick={selectDiceKey(storedDiceKeyDescriptor.keyId)}
          />
        )
      })
    }
    {/* <WidthSpacer width={paddingRight}>&nbsp;</WidthSpacer> */}
    </StoredDiceKeysRow>
  )
});

export const PREVIEW_DiceKeySelectorView = () => {
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testA", DiceKeyWithoutKeyId.fromHumanReadableForm("A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm).faces));
  // DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testB", DiceKeyWithoutKeyId.fromHumanReadableForm("B2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2t" as DiceKeyInHumanReadableForm).faces));
  // DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testC", DiceKeyWithoutKeyId.fromHumanReadableForm("C2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2t" as DiceKeyInHumanReadableForm).faces));
  // DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testY", DiceKeyWithoutKeyId.fromHumanReadableForm("Y3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY1t" as DiceKeyInHumanReadableForm).faces));
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testZ", DiceKeyWithoutKeyId.fromHumanReadableForm("Z2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2t" as DiceKeyInHumanReadableForm).faces));
  const [selectedDiceKeyId, setSelectedDiceKeyId] = React.useState<string | undefined>("testA");
  return  ( 
  <DiceKeySelectorView selectedDiceKeyId={selectedDiceKeyId} setSelectedDiceKeyId={(keyId) => setSelectedDiceKeyId(keyId)} />
  );
};