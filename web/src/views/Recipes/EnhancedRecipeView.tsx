import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { JsxReplacer } from "../../utilities/JsxReplacer";
import { FormattedRecipeSpan, HostNameSpan, LengthFieldValueSpan, SequenceNumberValueSpan } from "./DerivationView/RecipeStyles";
import styled from "styled-components";
import { Recipe } from "@dicekeys/dicekeys-api-js";

export const EnhancedRecipeView = ({recipeJson}: {recipeJson?: string}) => {
  try {
    const recipe = (recipeJson == null ? {} : JSON.parse(recipeJson)) as Recipe;
    const replacer = new JsxReplacer(recipeJson ?? "");
    const sequenceNumber = recipe["#"];
    if (sequenceNumber != null && sequenceNumber >= 2) {
      replacer.replace(`"#":${sequenceNumber}`, (<>
          "#":<SequenceNumberValueSpan>{sequenceNumber}</SequenceNumberValueSpan>
        </>));
    }
    const lengthInChars = "lengthInChars" in recipe ? recipe.lengthInChars : undefined;
    if (lengthInChars != null) {
      replacer.replace(`"lengthInChars":${lengthInChars}`, (<>
          "lengthInChars":
          <LengthFieldValueSpan>{lengthInChars}</LengthFieldValueSpan>
        </>));
    }
    const purpose = recipe.purpose;
    if (purpose != null) {
      const jsonEncodedPurpose = JSON.stringify(purpose)
      const jsonEscapedPurpose = jsonEncodedPurpose.substr(1, jsonEncodedPurpose.length - 2);
      replacer.replace(`"purpose":${jsonEncodedPurpose}`, (<>
          "purpose":"<HostNameSpan>{jsonEscapedPurpose}</HostNameSpan>"
        </>));
    }
    const allow = recipe.allow;
    if (allow != null) {
      allow.forEach( ({host}) => {
        replacer.replace(`"host":"${host}"`, (<>
          "host":"<HostNameSpan>{host}</HostNameSpan>"
        </>));
      });
    }
    return (
      <>
        {replacer.replacement.map( (item, index) => (
          <FormattedRecipeSpan key={`${index}`}>{item}</FormattedRecipeSpan>
        ))}
      </>
    );
  } catch {
    return (<>{ recipeJson }</>)
  }
}

const RawRecipeViewContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  font-size: 0.9rem;
`;

const RawRecipeLabelDiv = styled.div`
  margin-right: 0.5rem;
  font-style: italic;
  user-select: none;
`;

const RawRecipeValueDiv = styled.div`
  overflow-wrap: break-word;
  font-family: monospace;
  color: rgba(0, 0, 0, 0.75);
`;

const EmptyRawRecipeSpan = styled.span`
  font-style: italic;
`

export const LabeledEnhancedRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => (
  <RawRecipeViewContainer>
    <RawRecipeLabelDiv>Recipe:</RawRecipeLabelDiv>
    <RawRecipeValueDiv>
      {state.recipeJson == null ? (
        <EmptyRawRecipeSpan>{"{}"}</EmptyRawRecipeSpan>
      ) : (
        <EnhancedRecipeView recipeJson={ state.recipeJson  }/>
      )}
    </RawRecipeValueDiv>
  </RawRecipeViewContainer>
));