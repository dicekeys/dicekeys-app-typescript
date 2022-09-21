import React from "react";
import { observer } from "mobx-react";
import styled from "styled-components";
import { RecipeBuilderState } from "../RecipeBuilderState";
import { ButtonRow, OptionButton } from "../../../css/Button";
import { ModalOverlayForWarningDialog } from "../../../views/Navigation/NavigationLayout";

const WarningDiv = styled.div``;

export const RawJsonWarning = observer ( ({state}: {
  state: RecipeBuilderState
  }) => !state.showRawJsonWarning ? null : (
  <ModalOverlayForWarningDialog>
    <WarningDiv>
      <div>
        <h3>
          Entering a recipe in raw JSON format can be dangerous.
        </h3>
        <ul>
          <li>
            If you enter a recipe provided by someone else, it could be a trick to get you to re-create a secret you use for another application or purpose.
          </li>
          <li>
            If you generate the recipe yourself and forget even a single character, you will be unable to re-generate the same secret again.
            (Saving the recipe won't help you if you lose the device(s) it's saved on.)
          </li>
        </ul>
      </div>
      <ButtonRow>
        <OptionButton onClick={state.abortEnteringRawJson}>Go back</OptionButton>
        <OptionButton onClick={state.dismissRawJsonWarning}>I accept the risk</OptionButton>
      </ButtonRow>
    </WarningDiv>
  </ModalOverlayForWarningDialog>
));
