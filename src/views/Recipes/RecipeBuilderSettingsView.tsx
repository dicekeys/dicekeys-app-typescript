import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { LengthInCharsFormFieldView, SequenceNumberFormFieldView } from "./SequenceNumberView";
import { RecipeBuilderState } from "./RecipeBuilderState";

// export const RecipeTypeFieldView = observer( ({recipeTypeState}: {recipeTypeState: RecipeTypeState} ) => (
//   <div className={css.form_item}>
//     <div className={css.form_content}><RecipeTypeSelectorView recipeTypeState={recipeTypeState}  /></div>
//     <div className={css.form_description}>Help for Secret vs. Password.</div>
//   </div>
// ));


export const PurposeFieldView = observer( ({state}: {state: RecipeBuilderState} ) => {
  if (!state.mayEditPurpose) {
    return null;
    // FIXME
  }
  return (
    <div className={css.form_item}>
      <div className={css.form_content}>
        <div className={css.vertical_labeled_field}>
          <input type="text" className={css.host_name_text_field} value={state.purpose ?? ""} placeholder="https://example.com/path?search"
            onInput={ e => state.setPurpose(e.currentTarget.value) } />
          <label className={css.label_below}>Purpose</label>
        </div>
      </div>
      <div className={css.form_description}>
        The purpose of the secret.
        If specified as a URL or comma-separate list of host names, the website(s) or app(s)
        associated with the URL will be able to request the generated {state.type === "Password" ? "password" : "secrets/keys"}.
      </div>
    </div>
  );
});

export const RecipeBuilderSettingsView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div>
      {/* <RecipeTypeFieldView recipeTypeState={props.state} /> */}
      <PurposeFieldView state={state} />
      <LengthInCharsFormFieldView state={state} />
      <SequenceNumberFormFieldView state={state} />
    </div>
  );
});
