import React from "react";
import { AndClause } from "../basics";
import { Recipe, DerivableObjectName } from "@dicekeys/dicekeys-api-js";
import { describeRecipeType } from "./DescribeRecipeType";
import { observer } from "mobx-react";
import { HostNameSpan, LengthFieldValueSpan, PurposeSpan, SequenceNumberValueSpan } from "./DerivationView/RecipeStyles";
import styled from "styled-components";
import { defaultOnException } from "../../utilities/default-on-exception";

interface RecipeState {
  type?: DerivableObjectName;
  recipeJson?: string;
  recipeIsValid: boolean;
}


const HostNameView = ({host}: {host: string}) => (
  host.startsWith("*.") ?
  (<><HostNameSpan>{ host.substring(2) }</HostNameSpan> (and its subdomains)</>) :
  (<><HostNameSpan>{ host }</HostNameSpan> (but not its subdomains)</>)
)

export const RecipePurposeContentView = ({recipe}: {recipe: Recipe | undefined}) => (<>
  { recipe == null || !recipe.purpose ? null : (
    <> for the purpose of &lsquo;<PurposeSpan>{ recipe.purpose }</PurposeSpan>&rsquo;</>
  )}{ recipe == null || !recipe.allow || recipe.allow.length == 0 ? null : (
    <> for use by <AndClause items={recipe.allow.map( ({host}) => (<HostNameView {...{host}}/>)
      )}/>
    </>)}
  </>
);


export const RecipeDescriptionContentView = observer ( ({state}: {state: RecipeState}) => {
  const {type, recipeJson, recipeIsValid} = state;
  if (type == null || recipeJson == null || !recipeIsValid) return null;
  const recipe = defaultOnException( () => (JSON.parse(recipeJson ?? "{}") as Recipe) );
  if (recipe == null) {
    return (<><i>Improperly formatted JSON {describeRecipeType(type)} recipe</i></>);
  }

  const withClauses: JSX.Element[] = [];
  if (type === "Password" && "lengthInChars" in recipe) {
    withClauses.push((<> a maximum length of <LengthFieldValueSpan>{ recipe.lengthInChars }</LengthFieldValueSpan> characters</>));
  }
  if (recipe["#"]) {
    withClauses.push((<> sequence number <SequenceNumberValueSpan>{recipe["#"]}</SequenceNumberValueSpan></>));
  }  
  return (
    <>
     Create a {describeRecipeType(type)}
     <RecipePurposeContentView {...{recipe}} />
      { withClauses.length == 0 ? null : (
        <> with <AndClause items={withClauses}/></>
      )}.</>
  );
});

const RecipeDescriptionViewDiv = styled.div`
  display: block;
  align-self: flex-start;
  background-color: rgba(238, 238, 255, 1);
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-size: 1rem;
`;

export const RecipeDescriptionView = (props: {state: RecipeState}) => (
  <RecipeDescriptionViewDiv>
    <RecipeDescriptionContentView {...props} />
  </RecipeDescriptionViewDiv>
)