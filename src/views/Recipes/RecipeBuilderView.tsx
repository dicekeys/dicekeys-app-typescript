import React from "react";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { RecipeBuilderSettingsView } from "./RecipeBuilderSettingsView";

export const RecipeView = observer( ( props: {
    state: RecipeBuilderState /*, builderState: RecipeBuilderState */
    cachedApiCalls: CachedApiCalls
  }) => {
  return (
    <div>
      <RecipeBuilderSettingsView state={props.state} />
    </div>
  );
});

