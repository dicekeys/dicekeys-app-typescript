import { observer } from "mobx-react";
import React from "react";

import styled, { css } from "styled-components";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { cssCalcTyped, cssExprWithoutCalc } from "../utilities";
import { DiceKeyWithKeyId, DiceKeyWithoutKeyId, facesFromPublicKeyDescriptor } from "../dicekeys/DiceKey";
import { DiceKeyInHumanReadableForm } from "../dicekeys/DiceKey";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state";
import LoadDiceKeyImage from "../images/Scanning a DiceKey.svg";
import { DivSupportingInvisible } from "../css";
import { HideRevealSecretsState } from "../state/stores/HideRevealSecretsState";




const HideInstruction = styled(DivSupportingInvisible)`
  font-family: sans-serif;
  font-style: italic;
  font-size: 1.25rem;
  user-select: none;
`

interface OptionalSpaceBetweenItems {
  $spaceBetweenItems?: string; // default: min(2vw, 2vh)`
}
const defaultSpaceBetweenItems = `min(2vw, 2vh)`;
interface OptionalSelectedItemWidth {
  $selectedItemWidth?: string; // default: min(40vw, 50vh)
}
const defaultSelectedItemWidth = `min(40vw, 50vh)`;
interface OptionalRatioOfSelectedItemWidthToSelectableItemWidth {
  $ratioOfSelectedItemWidthToSelectableItemWidth?: string; // default: 2
}
const defaultRatioOfSelectedItemWidthToSelectableItemWidth = `2`;
interface OptionalRowWidth {
  $rowWidth?: string; // default `90vw`
}
const defaultRowWidth = `90vw`;
interface SelectorViewSizeModel extends
  OptionalSpaceBetweenItems,
  OptionalSelectedItemWidth,
  OptionalRatioOfSelectedItemWidthToSelectableItemWidth,
  OptionalRowWidth
  {}

const itemPadding = ({$spaceBetweenItems: spaceBetweenItems=defaultSpaceBetweenItems}: OptionalSpaceBetweenItems) => `( (${cssExprWithoutCalc(spaceBetweenItems)}) / 2 )` as const;
// const keyRowWidth = `90vw` as const;


const selectableItemWidth = ({
  $selectedItemWidth: selectedItemWidth=defaultSelectedItemWidth,
  $ratioOfSelectedItemWidthToSelectableItemWidth: ratioOfSelectedItemWidthToSelectableItemWidth=defaultRatioOfSelectedItemWidthToSelectableItemWidth,
}: OptionalSelectedItemWidth & OptionalRatioOfSelectedItemWidthToSelectableItemWidth) => 
  cssExprWithoutCalc(`${cssExprWithoutCalc(selectedItemWidth)} / ${cssExprWithoutCalc(ratioOfSelectedItemWidthToSelectableItemWidth)}`);

// const selectedItemSize = `min(40vw, 50vh)` as const;
// const selectableItemSize = `(${cssExprWithoutCalc(selectedItemSize)} / 3)` as const;
const selectableItemSizeWithMargins = (sizeModel: SelectorViewSizeModel) =>
  `(${selectableItemWidth(sizeModel)} + ${cssExprWithoutCalc(sizeModel.$spaceBetweenItems ?? defaultSpaceBetweenItems)})` as const;

interface SpacingInformation {
  $indexSelected: number;
  $numberOfItems: number;
}

const paddingRequiredToCenterOneEdge = ({
  numberOfElementsBetweenItemAndEdge,
  ...sizeModel
}: 
  {numberOfElementsBetweenItemAndEdge: number} & SelectorViewSizeModel
) => {
  const {
    $spaceBetweenItems: spaceBetweenItems=defaultSpaceBetweenItems,
    $selectedItemWidth: selectedItemWidth=defaultSelectedItemWidth,
    $rowWidth: rowWidth=defaultRowWidth,
  } = sizeModel;
  const paddingRequiredIfNoObjectsBetweenThisObjectAndEdge =
    `( (${rowWidth} - (${selectedItemWidth} + ${spaceBetweenItems}) ) / 2)` as const;
  const paddingRequireAccountingForObjectsBetweenThisObjectAndEdge =
    `${paddingRequiredIfNoObjectsBetweenThisObjectAndEdge} - (${numberOfElementsBetweenItemAndEdge} * ${selectableItemSizeWithMargins(sizeModel)})` as const;
  const neverLessThanZero = `max(0px,${paddingRequireAccountingForObjectsBetweenThisObjectAndEdge})` as const;
  const padding = `calc(${neverLessThanZero})` as const;
  return padding;
}


const RowWithSelectedItemScrolledToCenter = styled.div<SpacingInformation & SelectorViewSizeModel>`
  box-sizing: border-box;
  ${ ({$indexSelected: indexSelected, $numberOfItems: numberOfItems, ...sizeModel}) => (indexSelected < 0) ? css`` : 
    css`
      padding-right: ${paddingRequiredToCenterOneEdge({numberOfElementsBetweenItemAndEdge: numberOfItems - (indexSelected + 1), ...sizeModel})};
      padding-left: ${paddingRequiredToCenterOneEdge({numberOfElementsBetweenItemAndEdge: indexSelected, ...sizeModel})};
  `}
  width: ${ sizeModel => sizeModel.$rowWidth ?? defaultRowWidth};
  min-height: ${ sizeModel => cssCalcTyped(
    `${cssExprWithoutCalc(sizeModel.$selectedItemWidth ?? defaultSelectedItemWidth)} + 1.25rem`
  ) };
  display: flex;
  flex-direction: row;
  justify-content: ${ ({$indexSelected: indexSelected}) => indexSelected < 0 ? "center" : "flex-start"  };
  align-items: center;
  overflow-x: auto;
`;

const RowWithSelectedItemScrolledToCenterItem = styled.div<SelectorViewSizeModel>`
  display: flex;
  border: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-left: calc(${sizeModel => itemPadding(sizeModel)});
  padding-right: calc(${sizeModel => itemPadding(sizeModel)});
  border-radius: calc(${sizeModel => itemPadding(sizeModel)})
`

const SelectableItemViewContainer = styled(RowWithSelectedItemScrolledToCenterItem)<SelectorViewSizeModel>`
  cursor: grab;
  user-select: none;
  width: calc(${ sizeModel => selectableItemWidth(sizeModel)} );
  :hover {
    background-color: rgba(0,0,0,0.25);
  }
  :active {
    background-color: rgba(0,0,0,0.50);
  }
`;

const SelectedItemViewContainer = styled(RowWithSelectedItemScrolledToCenterItem)<SelectorViewSizeModel>`
  width: calc(${ sizeModel => sizeModel.$selectedItemWidth ?? defaultSelectedItemWidth });
`;

const SelectableDiceKeyView = observer ( (props: {
  storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice;
  onClick: () => void
} & SelectorViewSizeModel) => {
  const {storedDiceKeyDescriptor, onClick, ...sizeModel} = props;
  return (
    <SelectableItemViewContainer
      key={storedDiceKeyDescriptor.keyId}
      {...sizeModel}
    >
      <DiceKeyView
        onClick={onClick}
        $size={`${cssCalcTyped(selectableItemWidth(sizeModel))}`}
        faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
        obscureAllButCenterDie={true}
        showLidTab={true}
      />
    </SelectableItemViewContainer>
  )
});

const SelectedDiceKeyView = observer ( ({diceKey, ...sizeModel}: {diceKey?: DiceKeyWithKeyId} & SelectorViewSizeModel) => {
  return (
    <SelectedItemViewContainer
      {...sizeModel}
      key={diceKey?.keyId}
      // Automatically scroll selected DiceKeys into the center.
      ref={ (e) => {
          if (e == null) return;
          e.scrollIntoView({inline: "center", block: "center"})
       }}
    >
        <DiceKeyView
          $size={`${cssCalcTyped(sizeModel.$selectedItemWidth ?? defaultSelectedItemWidth)}`}
          diceKey={diceKey}
          showLidTab={false}
        />
        <HideInstruction
          $invisible={diceKey && HideRevealSecretsState.shouldDiceKeyBeHidden(diceKey) }
          style={{
            fontSize: cssCalcTyped(`${sizeModel.$selectedItemWidth ?? defaultSelectedItemWidth} / 24`),
            cursor: "grab",
          }}
          onClick={() => diceKey && HideRevealSecretsState.toggleHideRevealDiceKey(diceKey, false) }
        >
          press to hide all but center face
        </HideInstruction>
    </SelectedItemViewContainer>
  )
});


export const SubViewButtonImage = styled.img<OptionalSelectedItemWidth>`
  height: calc(${ sizeModel => selectableItemWidth(sizeModel)} * 0.75);
`;

export const SubViewButtonCaption = styled.div<OptionalSelectedItemWidth>`
  font-size: calc(${sizeModel => selectableItemWidth(sizeModel)} / 12);
  margin-top: calc(${sizeModel => selectableItemWidth(sizeModel)} / 10);
`;


interface DiceKeySelectorViewProps extends SelectorViewSizeModel {
  selectedDiceKeyId: string | undefined;
  setSelectedDiceKeyId: (newKeyId: string | undefined) => void;
  loadRequested: () => void;
}

export const DiceKeySelectorView = observer ( ({
  loadRequested,
  selectedDiceKeyId,
  setSelectedDiceKeyId,
  ...sizeModel
}: DiceKeySelectorViewProps) => {
  const storedDiceKeyDescriptors = DiceKeyMemoryStore.keysInMemoryOrSavedToDevice;
  const indexSelected = storedDiceKeyDescriptors.findIndex( descriptor => descriptor.keyId === selectedDiceKeyId );
  const selectDiceKey = (keyId: string) => () => {
    setSelectedDiceKeyId(keyId);
  }
  // The row has one item for each DiceKey and one for the button to load more DiceKeys.
  const numberOfItems = storedDiceKeyDescriptors.length +  1;   
  return (
    <RowWithSelectedItemScrolledToCenter {...{$numberOfItems: numberOfItems, $indexSelected: indexSelected, ...sizeModel}}>
      {// Iterate through all the DiceKeys to display
        storedDiceKeyDescriptors.map( (storedDiceKeyDescriptor) => {
          const isSelected = storedDiceKeyDescriptor.keyId === selectedDiceKeyId;
          return isSelected ? (
            <SelectedDiceKeyView
              {...sizeModel}
              diceKey={DiceKeyMemoryStore.diceKeyForKeyId(storedDiceKeyDescriptor.keyId)}
              key={storedDiceKeyDescriptor.keyId}
            />
            ) : (
            <SelectableDiceKeyView
               {...sizeModel}
               key={storedDiceKeyDescriptor.keyId} {...{storedDiceKeyDescriptor}}
              onClick={selectDiceKey(storedDiceKeyDescriptor.keyId)}
            />
          )
        })
      // End of iteration
      }
      <SelectableItemViewContainer onClick={loadRequested} {...sizeModel}>
        <SubViewButtonImage src={LoadDiceKeyImage} {...sizeModel} />
        <SubViewButtonCaption {...sizeModel}>{
          storedDiceKeyDescriptors.length === 0 ? "Load a DiceKey" : "Load another DiceKey"
        }</SubViewButtonCaption>
      </SelectableItemViewContainer>
    </RowWithSelectedItemScrolledToCenter>
  )
});

export const PREVIEW_DiceKeySelectorView = () => {
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testA", DiceKeyWithoutKeyId.fromHumanReadableForm("A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm).faces));
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testB", DiceKeyWithoutKeyId.fromHumanReadableForm("B2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2t" as DiceKeyInHumanReadableForm).faces));
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testC", DiceKeyWithoutKeyId.fromHumanReadableForm("C2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2t" as DiceKeyInHumanReadableForm).faces));
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testY", DiceKeyWithoutKeyId.fromHumanReadableForm("Y3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY3tZ6tY1t" as DiceKeyInHumanReadableForm).faces));
  DiceKeyMemoryStore.addDiceKeyWithKeyId(new DiceKeyWithKeyId("testZ", DiceKeyWithoutKeyId.fromHumanReadableForm("Z2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2tZ2t" as DiceKeyInHumanReadableForm).faces));
  const [selectedDiceKeyId, setSelectedDiceKeyId] = React.useState<string | undefined>("testY");
  return  ( 
  <DiceKeySelectorView
    selectedDiceKeyId={selectedDiceKeyId}
    setSelectedDiceKeyId={(keyId) => setSelectedDiceKeyId(keyId)}
    loadRequested={() => alert("Load DiceKey clicked")}
    $rowWidth={`90vw`}
    $selectedItemWidth={`min(70vh,50vw)`}
    $ratioOfSelectedItemWidthToSelectableItemWidth={`4`}
  />
  );
};