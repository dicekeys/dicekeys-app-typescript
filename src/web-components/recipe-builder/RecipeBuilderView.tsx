import React from "react";
import { makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderCommonState } from "./RecipeBuilderCommonState";
import { RecipeBuilderForTemplateState, RecipeBuilderForTemplateView } from "./RecipeBuilderForTemplateView";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";
import { RecipeBuilderCustomState, RecipeBuilderCustomView } from "./RecipeBuilderCustomView";
import css from "./recipe-builder.module.css";
import { toBip39 } from "../../formats/bip39/bip39";
import { uint8ClampedArrayToHexString } from "../../utilities/convert";

export enum RecipeBuilderType {
  Custom,
  Template
};

export class RecipeBuilderViewState {
  type: RecipeBuilderType;
  builderStateForTemplate?: RecipeBuilderForTemplateState = new RecipeBuilderForTemplateState(DerivationRecipeTemplateList[0]);
  builderStateForCustom?: RecipeBuilderCustomState = new RecipeBuilderCustomState("Secret");

  get subState(): RecipeBuilderCommonState {
    switch(this.type) {
      case RecipeBuilderType.Custom:
        return this.builderStateForCustom!;
      case RecipeBuilderType.Template:
        return this.builderStateForTemplate!;
    }
  }

  constructor(type: RecipeBuilderType = RecipeBuilderType.Custom) {
    this.type = type;
    makeAutoObservable(this);
  }
}

export const RecipeNameView = observer( ( props: {state: RecipeBuilderCommonState}) => (
  <div className={css.recipe_name}>Recipe for {props.state.name}</div>
));

export const RawRecipeView = observer( ( props: {state: RecipeBuilderCommonState}) => (
  <div>{ props.state.recipe }</div>
));

export const Bip39View = ( props: {secret: Uint8ClampedArray}) => {
  const [bip39, setBip39] = React.useState<string | null>(null);
  React.useEffect(() => {
    ( async () => { setBip39(await toBip39(props.secret)) } )()
  });
  return (
    <div className={css.derived_value_row}>
      <div className={css.derived_value_label}>Bip39:</div>
      <div className={css.derived_value_contents}>{ bip39 }</div>
    </div>
);
}

export const JsonFieldView = ({json}: {json?: string}) => json ? (
  <div className={css.derived_value_row}>
  <div className={css.derived_value_label}>JSON:</div>
  <div className={css.derived_value_contents_json}>{ JSON.stringify(JSON.parse(json), undefined, 2) }</div>
  </div>
) : null;

export const DerivedValueView = observer( ( props: {precalculatedApiCalls: CachedApiCalls, state: RecipeBuilderCommonState}) => {
  const {type, recipe} = props.state;
  const api = props.precalculatedApiCalls;
  if (!recipe) { return null; }

  if (type === "Password") {
    const password = api.getPasswordForRecipe(recipe);
    if (typeof(password) === "undefined") { return null; }
    return (
      <div>
        <JsonFieldView json={api.getPasswordJsonForRecipe(recipe)} />
        <div className={css.derived_value_row}>
          <div className={css.derived_value_label}>Password:</div>
          <div className={css.derived_value_contents}>{ password }</div>
        </div>
      </div>
    );
    
  } else if (type === "Secret") {
    const secret = api.getSecretBytesForRecipe(recipe);
    if (typeof(secret) === "undefined") { return null; }
    return (
      <div>
        <JsonFieldView json={api.getSecretJsonForRecipe(recipe)} />
        <div className={css.derived_value_row}>
          <div className={css.derived_value_label}>Hex:</div>
          <div className={css.derived_value_contents}>{ uint8ClampedArrayToHexString(secret) }</div>
        </div>
        <Bip39View secret={secret} />
      </div>
    );

  } else if (type === "SymmetricKey") {
    return (
      <div>
        <JsonFieldView json={api.getSymmetricKeyJsonForRecipe(recipe)} />
      </div>
    );

  } else if (type === "UnsealingKey") {
    return (
      <div>
        <JsonFieldView json={api.getUnsealingKeyJsonForRecipe(recipe)} />
      </div>
    );
  }
return null;
});

export const RecipeSelector = observer( ( props: {precalculatedApiCalls: CachedApiCalls, state: RecipeBuilderCommonState}) => (
  <div>{ props.precalculatedApiCalls.getPasswordForRecipe(props.state.recipe!) }</div>
));

export const RecipeBuilderView = observer( ( props: {seedString: string, viewState?: RecipeBuilderViewState}) => {
  const state = props.viewState ?? new RecipeBuilderViewState(RecipeBuilderType.Custom);
  const {subState} = state;
  const precalculatedApiCalls = new CachedApiCalls(props.seedString)

  return (
    <div>
      <RecipeNameView state={subState} />
      <div className={css.recipe_header}>Recipe Fields</div>
      {
        (() => {
          switch(state.type) {
            // case RecipeBuilderType.Custom: return ( state.builderStateForCustom! );
            case RecipeBuilderType.Template: return (
              <RecipeBuilderForTemplateView state={state.builderStateForTemplate!} />
            );
            case RecipeBuilderType.Custom: return (
              <RecipeBuilderCustomView state={state.builderStateForCustom!} />
            );
            default: return null;
          }
        })()
      }
      <div className={css.recipe_header}>Internal Recipe Format</div>
      <RawRecipeView state={subState} />
      <div className={css.recipe_header}>Derived value</div>
      <DerivedValueView state={subState} precalculatedApiCalls={precalculatedApiCalls} />
    </div>
  );
});

