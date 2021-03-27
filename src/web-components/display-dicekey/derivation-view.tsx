import React from "react";
import { observer  } from "mobx-react";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";
import { RecipeBuilderForTemplateState, RecipeBuilderView } from "../recipe-builder/";

// export class DerivationViewState {

//   sequenceNumber: number = 1;
//   setSequenceNumber = (newSequenceNumber: number) => this.sequenceNumber = newSequenceNumber;

//   constructor() { makeAutoObservable(this) }
// }


// export const RecipeBuilderView = observer( ( props: {seedString: string, state: RecipeBuilderForTemplateState}) => {
//   return (
//     <div>
//       <div>Recipe for {props.state.name}</div>
//       <SequenceNumberFormFieldView sequenceNumberState={props.state} />
//       <div>{ props.state.recipe }</div>
//       <div>{ props.state.password ?? ""  }</div>
//     </div>
//   );
// });


interface DerivationViewProps {
  seedString: string;
  state?: RecipeBuilderForTemplateState;
}


export const DerivationView = observer( ( props: DerivationViewProps) => {
  return (
      <RecipeBuilderView seedString={props.seedString} />
  );
});
