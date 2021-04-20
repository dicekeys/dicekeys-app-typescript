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

export const RecipesDerivedValuesView = observer( ( props: {cachedApiCalls: CachedApiCalls, state: {type?: DerivationRecipeType, recipeJson?: string}}) => {
  const {type, recipeJson} = props.state;
  const api = props.cachedApiCalls;
  if (!recipeJson || !type) { return null; }

  if (type === "Password") {
    const password = api.getPasswordForRecipe(recipeJson);
    if (typeof(password) === "undefined") { return null; }
    return (
      <div>
        <JsonFieldView json={api.getPasswordJsonForRecipe(recipeJson)} />
        <div className={css.derived_value_row}>
          <div className={css.derived_value_label}>Password:</div>
          <GeneratedPasswordView value={password}/>
        </div>
      </div>
    );
    
  } else if (type === "Secret") {
    const secret = api.getSecretBytesForRecipe(recipeJson);
    if (typeof(secret) === "undefined") { return null; }
    return (
      <div>
        <JsonFieldView json={api.getSecretJsonForRecipe(recipeJson)} />
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
        <JsonFieldView json={api.getSymmetricKeyJsonForRecipe(recipeJson)} />
      </div>
    );

  } else if (type === "UnsealingKey") {
    return (
      <div>
        <JsonFieldView json={api.getUnsealingKeyJsonForRecipe(recipeJson)} />
      </div>
    );
  }
return null;
});

