import React from "react";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { DiceKeysAppSecretRecipe, RecipeBuilderState } from "./RecipeBuilderState";
import css from "./recipe-builder.module.css";
import { toBip39 } from "../../formats/bip39/bip39";
import { uint8ClampedArrayToHexString } from "../../utilities/convert";
import { CopyButton, OptionallyObscuredTextView, SecretFieldWithCommonObscureState } from "../basics";
import { DerivationRecipeType } from "~dicekeys";
import { GlobalSharedToggleState } from "~state";
import { AsyncCalculation } from "~utilities/AsyncCalculation";


export const EnhancedRecipeView = ({recipeJson}: {recipeJson?: string}) => {
  const recipe = JSON.parse(recipeJson || "{}") as DiceKeysAppSecretRecipe;
  var ingredients: (JSX.Element | string)[] = [recipeJson ?? ""];
  const replace = (stringToReplace: string, replacementElement: JSX.Element) => {
    ingredients = ingredients.reduce( (result, item ) => {
      if (typeof item !== "string" || item.indexOf(stringToReplace) < 0) {
        result.push(item);
      } else {
        const indexOfString = item.indexOf(stringToReplace);
        const prefix = item.substr(0, indexOfString);
        const suffix = item.substr(indexOfString + stringToReplace.length);
        result.push(prefix, replacementElement, suffix);
      }
      return result;
    }, [] as (JSX.Element | string)[])
  }
  const sequenceNumber = recipe["#"];
  if (sequenceNumber != null && sequenceNumber >= 2) {
    replace(`"#":${sequenceNumber}`, (<>"#":<span className={css.sequence_number_span}>{sequenceNumber}</span></>));
  }
  const lengthInChars = recipe.lengthInChars;
  if (lengthInChars != null) {
    replace(`"lengthInChars":${lengthInChars}`, (<>"lengthInChars":<span className={css.length_span}>{lengthInChars}</span></>));
  }
  const purpose = recipe.purpose;
  if (purpose != null) {
    const jsonEncodedPurpose = JSON.stringify(purpose)
    const jsonEscapedPurpose = jsonEncodedPurpose.substr(1, jsonEncodedPurpose.length - 2);
    replace(`"purpose":${JSON.stringify(purpose)}`, (<>"purpose":"<span className={css.host_name_span}>{jsonEscapedPurpose}</span>"</>));
  }
  const allow = recipe.allow;
  if (allow != null) {
    allow.forEach( ({host}) => {
      replace(`"host":"${host}"`, (<>"host":<span className={css.host_name_span}>{host}</span></>));
    });
  }
  return (
    <>
      {ingredients.map( (item, index) => (
        <span key={`${index}`}>{item}</span>
      ))}
    </>
  );
}

export const RawRecipeView = observer( ( props: {state: RecipeBuilderState}) => (
  <div><EnhancedRecipeView recipeJson={ props.state.recipeJson  }/></div>
));

const Bip39Calculation = new AsyncCalculation<string>();
const bip39Observable = (secret: Uint8ClampedArray) =>
  Bip39Calculation.get( uint8ClampedArrayToHexString(secret), () => toBip39(secret) );

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
    // const passwordJson = api.getPasswordJsonForRecipe(recipeJson);
    if (typeof(password) === "undefined") { return null; }
    return (
      <table>
        <tbody>
        {/* <tr>
          <th className={css.derived_value_header}>JSON</th>
          <td><CopyButton value={passwordJson}/></td>
          <td className={css.derived_value_contents_json_pre}><OptionallyObscuredTextView value={passwordJson} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value }  /></td>
        </tr> */}
        <tr>
          <th className={css.derived_value_header}>Password</th>
          <td><CopyButton value={password}/></td>
          <td className={css.derived_value_contents}><OptionallyObscuredTextView value={password} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value }  /></td>
        </tr>
        </tbody>
      </table>
    );
    // return (
    //   <div>
    //     <JsonFieldView json={api.getPasswordJsonForRecipe(recipeJson)} />
    //     <div className={css.derived_value_row}>
    //       <div className={css.derived_value_label}>Password:</div>
    //       <GeneratedPasswordView value={password}/>
    //     </div>
    //   </div>
    // );
    
  } else if (type === "Secret") {
    const secret = api.getSecretBytesForRecipe(recipeJson);
    const json = api.getSecretJsonForRecipe(recipeJson);
    if (secret == null || json == null) { return null; }
    const secretHex = uint8ClampedArrayToHexString(secret);
    const secretBip39 = bip39Observable(secret);
    return (
      <table style={{maxWidth: "50vw"}}>
        <tbody>
        <tr>
          <th className={css.derived_value_header}>JSON</th>
          <td><CopyButton value={json}/></td>
          <td className={css.derived_value_contents_json_pre}><OptionallyObscuredTextView value={json} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value }  /></td>
        </tr>
        <tr>
          <th className={css.derived_value_header}>Hex</th>
          <td><CopyButton value={secretHex}/></td>
          <td className={css.derived_value_contents}><OptionallyObscuredTextView value={secretHex} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value }  /></td>
        </tr>
        <tr>
          <th className={css.derived_value_header}>Bip39</th>
          <td><CopyButton value={secretBip39}/></td>
          <td className={css.derived_value_contents}><OptionallyObscuredTextView value={secretBip39} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value }  /></td>
        </tr>
        </tbody>
      </table>
    );
    // return (
    //   <div>
    //     <JsonFieldView json={api.getSecretJsonForRecipe(recipeJson)} />
    //     <div className={css.derived_value_row}>
    //       <div className={css.derived_value_label}>Hex:</div>
    //       <SecretFieldWithCommonObscureState value={ uint8ClampedArrayToHexString(secret) } />
    //     </div>
    //     <Bip39View secret={secret} />
    //   </div>
    // );

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

