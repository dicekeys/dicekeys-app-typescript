import React from "react";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState } from "./RecipeBuilderState";
import css from "./recipe-builder.module.css";
import { toBip39 } from "../../formats/bip39/bip39";
import { uint8ClampedArrayToHexString } from "../../utilities/convert";
import { GeneratedPasswordView, SecretFieldWithCommonObscureState } from "../basics";
import { DerivationRecipeType } from "~dicekeys";

export const RawRecipeView = observer( ( props: {state: RecipeBuilderState}) => (
  <div>{ props.state.recipeJson }</div>
));

export const Bip39View = ( props: {secret: Uint8ClampedArray}) => {
  const [bip39, setBip39] = React.useState<string | null>(null);
  React.useEffect(() => {
    ( async () => { setBip39(await toBip39(props.secret)) } )()
  });
  return (
    <div className={css.derived_value_row}>
      <div className={css.derived_value_label}>Bip39:</div>
      <div style={{fontSize: "0.75vw"}}>
        <SecretFieldWithCommonObscureState value={bip39 ?? ""} />
      </div>
    </div>
);
}

export const JsonFieldView = ({json}: {json?: string}) => json ? (
  <div className={css.derived_value_row}>
  <div className={css.derived_value_label}>JSON:</div>
  <SecretFieldWithCommonObscureState value={JSON.stringify(JSON.parse(json), undefined, 2)} />
  {/* <div className={css.derived_value_contents_json}>{ JSON.stringify(JSON.parse(json), undefined, 2) }</div> */}
  </div>
) : null;

export const RecipesDerivedValuesView = observer( ( props: {precalculatedApiCalls: CachedApiCalls, state: {type?: DerivationRecipeType, recipe?: string, purpose?: string}}) => {
  const {type, recipe} = props.state;
  const api = props.precalculatedApiCalls;
  if (!recipe || !type) { return null; }

  if (type === "Password") {
    const password = api.getPasswordForRecipe(recipe);
    if (typeof(password) === "undefined") { return null; }
    return (
      <div>
        <JsonFieldView json={api.getPasswordJsonForRecipe(recipe)} />
        <div className={css.derived_value_row}>
          <div className={css.derived_value_label}>Password:</div>
          <GeneratedPasswordView value={password}/>
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
          <SecretFieldWithCommonObscureState value={ uint8ClampedArrayToHexString(secret) } />
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

