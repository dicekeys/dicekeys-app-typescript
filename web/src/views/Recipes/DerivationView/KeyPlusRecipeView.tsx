import React from "react";
import { observer } from "mobx-react";
import { RecipeBuilderState } from "../RecipeBuilderState";
import { DiceKey } from "../../../dicekeys/DiceKey";
import { DiceKeyViewAutoSized } from "../../../views/SVG/DiceKeyView";
import { ToggleState } from "../../../state";
import { HoverState } from "../../../state/reusable/HoverState";
import { visibility } from "../../../utilities/visibility";
import { RecipeDescriptionContentView } from "../RecipeDescriptionView";
import { MultilineRecipeJsonView } from "./MultilineRecipeView";
import {
  EditButtonHoverTextView,
  RecipeRibbonButtons,
  RecipeRibbonButtonsView
} from "./RecipeRibbonButtons";import * as Dimensions from "./Dimensions";
import styled from "styled-components";


const BigCaptionOrLabel = styled.span`
  font-family: sans-serif;
  font-size: ${Dimensions.LabelFontSizeVh}vh;
  flex-direction: row;
  color: rgba(0, 0, 0, 0.5)
`;

const RecipeViewContainer = styled.div`
  display: flex;
  flex-direction:column;
`;

const RecipeViewRoundedRect = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  background-color: rgba(128,128,196,0.10);
  padding: ${Dimensions.BoxPadding};
  width: ${Dimensions.recipeViewWidthCalculated};
  min-height: calc(${Dimensions.DiceKeyBoxSize} - 2 * (${Dimensions.BoxPadding}));
  border-radius: ${Dimensions.BoxPadding};
  color: rgba(0, 0, 0, 1);
`;

const InteriorLabelForRecipe = styled(BigCaptionOrLabel)`
  margin-left: 1rem;
`;

const RecipeSeparator = styled.div`
  min-height: "0.5vh";
  width: calc(${Dimensions.recipeViewWidthFormula } - 0.7rem);
  border-bottom: 1px solid rgba(0,0,0,0.1);
`;

const RecipeView = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>
}) => (
  <RecipeViewContainer>
    <RecipeRibbonButtonsView {...{recipeBuilderState, editButtonsHoverState}} />
    <RecipeViewRoundedRect>
      { !recipeBuilderState.recipeIsNotEmpty ? (
        <InteriorLabelForRecipe>Recipe</InteriorLabelForRecipe>
      ) : (<>
          <MultilineRecipeJsonView recipeJson={ recipeBuilderState.recipeJson  }/>
          <RecipeSeparator/>
          <div>
            <RecipeDescriptionContentView state={recipeBuilderState} />
          </div>  
        </>)
      }
    </RecipeViewRoundedRect>
  </RecipeViewContainer>
));

const KeyPlusRecipeColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const KeyPlusRecipeRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const RowElement = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
`;

const ElementInDiceKeyColumn = styled(RowElement)`
  width: calc(${Dimensions.DiceKeyBoxSize});
`;

const ElementInPlusSignColumn = styled(RowElement)`
  width: calc(${Dimensions.PlusSignViewWidth});
  font-size: ${Dimensions.DownArrowAndPlusSignViewHeight}vh;
`;

const ElementInRecipeColumn = styled(RowElement)`
  width: calc(${Dimensions.recipeViewWidthFormula});
`;

export const KeyPlusRecipeView = observer ( ( {diceKey, recipeBuilderState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState
}) => {
  const editButtonsHoverState = new HoverState<RecipeRibbonButtons>();
  return (
  <KeyPlusRecipeColumn>
    <EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/>
    <KeyPlusRecipeRow>
      {/* Key */}
      <ElementInDiceKeyColumn>
        <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight={Dimensions.DiceKeyBoxMaxHeight} maxWidth={Dimensions.DiceKeyBoxMaxWidth}
          obscureAllButCenterDie={ToggleState.ObscureDiceKey}
        />
      </ElementInDiceKeyColumn>
      {/* Plus sign */}
      <ElementInPlusSignColumn>+</ElementInPlusSignColumn>
      {/* Recipe */}
      <ElementInRecipeColumn>
        <RecipeView {...{recipeBuilderState, editButtonsHoverState}} />
      </ElementInRecipeColumn>
    </KeyPlusRecipeRow>
    <KeyPlusRecipeRow>
      {/* Key caption */}
      <ElementInDiceKeyColumn>
        <BigCaptionOrLabel>
          Key
        </BigCaptionOrLabel>
      </ElementInDiceKeyColumn>
      {/* Down arrow */}
      <ElementInPlusSignColumn>
        <span style={{
          marginTop: `-${0.15 * Dimensions.DownArrowAndPlusSignViewHeight}vh`,
        }}>&#8659;
        </span>
      </ElementInPlusSignColumn>
      {/* Recipe label (hidden if there's no recipe and label is inside recipe box) */}
      <ElementInRecipeColumn style={visibility(recipeBuilderState.recipeIsNotEmpty)}>
        <BigCaptionOrLabel>
          Recipe
        </BigCaptionOrLabel>
      </ElementInRecipeColumn>
    </KeyPlusRecipeRow>
  </KeyPlusRecipeColumn>
)});
