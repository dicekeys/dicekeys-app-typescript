import css from "./recipe-builder.module.css";
import React from "react";
import { action, makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/derivation-recipe";
import { SequenceNumberFormFieldView, SequenceNumberState } from "./recipe-builder-sequence-number";
import { RecipeBuilderCommonState } from "./recipe-builder-common-state";

const getHostRestrictionsArrayAsString = (hosts: string[]): string =>
  `[${hosts
        .map( host => `{"host":"*.${host}"}` )
        .join(",")
    }]`;

const getRecipeJson = (
  {hosts, sequenceNumber = 1, lengthInChars = 0}: {
  hosts: string[],
  sequenceNumber?: number,
  lengthInChars?: number
}): string => `{${
    [
      (hosts.length == 0) ? "" : `"allow":${getHostRestrictionsArrayAsString(hosts.sort())}`,
      (lengthInChars <= 0) ? "" : `"lengthInChars":${lengthInChars}`,
      (sequenceNumber == 1) ? "" : `"#":${sequenceNumber}`
    ].filter( s => s.length > 0)
    .join(",")
  }}`


export class RecipeBuilderCustomState implements RecipeBuilderCommonState, SequenceNumberState, RecipeTypeState, UrlOrHostListFieldState {
  type: DerivationRecipeType;
  sequenceNumber?: number = 1;
  lengthInChars?: number = undefined;

  hostsField: string = "";
  setHostsField = action( (newValue: string) => this.hostsField = newValue );

  get hosts(): string[] {
    try {
      // If the host field contains a valid URL, return the host name
      return [new URL(this.hostsField).hostname];
    } catch {}
    // Return a list of valid domains
    return this.hostsField.split(",")
      .map( i => {
        const potentialHostName = i.trim();
        try {
          // Get JavaScript's URL parser to validate the hostname for us
          if (potentialHostName === new URL(`https://${potentialHostName}/`).hostname) {
            return potentialHostName;
          }
        } catch {}
        return undefined;
      })
      .filter( i =>  i ) as string[];
  }

  setType = action( (type: DerivationRecipeType) => {
    this.type = type;
  });

  setSequenceNumber = action( (newSequenceNumber?: number) => {
    this.sequenceNumber = newSequenceNumber;
  });

  get recipe(): string {
    return getRecipeJson(this);
  }

  get name(): string {
    return (this.hosts.length == 0 ? "[blank]" : this.hosts.join(", ")) + (
      (this.sequenceNumber ?? 1) == 1 ? `` : ` (${this.sequenceNumber})`
    )
  }

  constructor(defaultType: DerivationRecipeType = "Password") {
    this.sequenceNumber = 1;
    this.type = defaultType;
    makeAutoObservable(this);
  }
}

interface RecipeTypeState {
  type: DerivationRecipeType;
  setType: (type: DerivationRecipeType) => void
}

export const RecipeTypeSelectorView = observer( ({recipeTypeState}: {recipeTypeState: RecipeTypeState}) => {
  const recipeTypesToSelectFrom: [DerivationRecipeType, string][] = [
    ["Secret", "seed"],
    ["Password", "password"],
    // ["SymmetricKey", "cryptographic key (symmetric)"],
    // ["UnsealingKey", "cryptographic key (public/private)"]
  ]
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <select value={ recipeTypeState.type } onChange={ (e) => recipeTypeState.setType(e.target.value as DerivationRecipeType) } >{
            recipeTypesToSelectFrom.map( ([recipeType, recipeName]) => (
              <option key={ recipeType } value={ recipeType } >{ recipeName }</option>
            ))
          }
          </select>  
          {/* <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, (sequenceNumberState.sequenceNumber ?? 1) - 1 )) } >-</button> */}
        </div>
        <label className={css.label_below}>Secret type</label>
      </div>
    </div>
  );
});

export const RecipeTypeFieldView = observer( ({recipeTypeState}: {recipeTypeState: RecipeTypeState} ) => (
  <div className={css.form_item}>
    <div className={css.form_content}><RecipeTypeSelectorView recipeTypeState={recipeTypeState}  /></div>
    <div className={css.form_description}>Help for Secret vs. Password.</div>
  </div>
));

interface UrlOrHostListFieldState {
  hostsField: string;
  setHostsField: (hostField: string) => void
}

export const UrlOrHostListFieldView = observer( ({state}: {state: UrlOrHostListFieldState} ) => (
  <div className={css.form_item}>
    <div className={css.form_content}>
      <div className={css.vertical_labeled_field}>
        <input type="text" className={css.host_name_text_field} value={state.hostsField} placeholder="https://example.com/path?search"
          onKeyUp={ e => state.setHostsField(e.currentTarget.value) }
          onChange={ e => state.setHostsField(e.currentTarget.value) } />
        <label className={css.label_below}>URL or host names</label>
      </div>
    </div>
    <div className={css.form_description}>Help for URL or class names field.</div>
  </div>
));

export const RecipeBuilderCustomView = observer( ( props: {state: RecipeBuilderCustomState}) => (
  <div>
    <RecipeTypeFieldView recipeTypeState={props.state} />
    <UrlOrHostListFieldView state={props.state} />
    <SequenceNumberFormFieldView sequenceNumberState={props.state} />
  </div>
));
