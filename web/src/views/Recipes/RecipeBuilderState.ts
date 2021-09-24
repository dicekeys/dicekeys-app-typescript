import { action, makeAutoObservable } from "mobx";
import {
  StoredRecipe, DerivationRecipeType, builtInRecipeIdentifier, isRecipeBuiltIn, RecipeIdentifier, savedRecipeIdentifier, SavedRecipeIdentifier, BuiltInRecipeIdentifier, DiceKeysAppSecretRecipe, LoadedRecipe, LoadedRecipeOrigin
} from "../../dicekeys/StoredRecipe";
import {
  addHostsToRecipeJson,
  addLengthInBytesToRecipeJson,
  addLengthInCharsToRecipeJson,
  addPurposeToRecipeJson,
  addSequenceNumberToRecipeJson,
  parseCommaSeparatedListOfHosts,
  RecipeFieldType,
  recipeJsonToAddableFields
} from "../../dicekeys/ConstructRecipe";
import { NumericTextFieldState } from "../basics/NumericTextFieldView";
import { Recipe } from "@dicekeys/dicekeys-api-js";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { describeRecipeType } from "./DescribeRecipeType";
import React from "react";
import { getRegisteredDomain } from "../../domains/get-registered-domain";


export enum RecipeEditingMode {
  NoRecipe,

  /**
   * When loading a saved recipe, default to no editing.
   * Transitions:
   *   -> OnlyEditSequenceNumber, when user hits "edit"
   */
  NoEdit,


  /**
   * Allow editing via fields exposed through template, but
   * not of raw JSON
   * Transitions:
   *   -> EditIncludingRawJson, when user hits "edit raw recipe JSON"
   */

  EditWithTemplateOnly,

  /**
   * Allow editing via fields exposed through template and
   * raw JSON.
   */
  EditIncludingRawJson,
}

// type EditingMode = "fields" | "json" | undefined;

// interface RecipeBuilderStateConstructorOptions {
//   type?: DerivationRecipeType;
//   purpose?: string;
//   editing?: boolean;
//   // fieldsToHide?: Set<RecipeFieldType>
//   // fieldsToMakeNonEditableByDefault?: Set<RecipeFieldType>
// }

export enum WizardStep {
  PickRecipe = 0,
  EnterSite = 1,
  EnterPurpose = 2.1,
  EnterRawJson = 2.2,
  Complete = 3
}

export class RecipeFieldFocusState {
  constructor(
    private state: {fieldInFocus?: RecipeFieldType, setFieldInFocus: (field?: RecipeFieldType) => void},
    private field: RecipeFieldType
  ) {}

  get isFieldInFocus(): boolean { return this.field === this.state.fieldInFocus};
  focus = () => this.state.setFieldInFocus(this.field);
  toggleFocus = () => this.state.setFieldInFocus(this.isFieldInFocus ? undefined : this.field);
};


/**
 * State for building and displaying recipes
 */
export class RecipeBuilderState {
  constructor(loadedRecipe?: LoadedRecipe) {
    makeAutoObservable(this);
    if (loadedRecipe != null) {
      this.loadRecipe(loadedRecipe);
    }
  }

  origin: LoadedRecipeOrigin | undefined;
  setOrigin = action( (origin: LoadedRecipeOrigin | undefined) => {
    this.origin = origin;
  } )

  type: DerivationRecipeType | undefined;
  get typeName(): string { return describeRecipeType(this.type) }
  get typeNameLc(): string { return this.typeName.toLocaleLowerCase() }

  rawJsonWarningDismissed: boolean = false;
  dismissRawJsonWarning = action ( () => {
    this.rawJsonWarningDismissed = true;
  });
  get showRawJsonWarning(): boolean {
    return (
      // If we're about to show a raw JSON editor
      (
        this.wizardStep === WizardStep.EnterRawJson ||
        ( this.wizardComplete &&
          this.editingMode === RecipeEditingMode.EditIncludingRawJson)  
      ) &&
      // and the user hasn't dismissed the warning of the dangers of this
      !this.rawJsonWarningDismissed
    );
  }
  abortEnteringRawJson = () => {
    if (this.wizardStep === WizardStep.EnterRawJson) {
      // Step back from the raw json step
      this.setWizardPrimaryFieldOverride(undefined);
    } else if (this.editingMode === RecipeEditingMode.EditIncludingRawJson) {
      this.setEditingMode(RecipeEditingMode.NoEdit);
    }
  }


  wizardPrimaryFieldOverride?: "purpose" | "rawJson" | undefined;
  setWizardPrimaryFieldOverride = action( (newValue: "purpose" | "rawJson" | undefined) => {
    this.wizardPrimaryFieldOverride = newValue;
  })
  setWizardPrimaryFieldOverrideFn = (newValue: "purpose" | "rawJson" | undefined) =>
    () => this.setWizardPrimaryFieldOverride(newValue);

  wizardPrimaryFieldEntered?: boolean;
  setWizardPrimaryFieldEntered = action( (newValue: boolean | undefined) => {
    this.wizardPrimaryFieldEntered = newValue;
    if (newValue) {
      this.editingMode = RecipeEditingMode.NoEdit;
    }
  })
  setWizardPrimaryFieldEnteredFn = (newValue: boolean | undefined) =>
    () => this.setWizardPrimaryFieldEntered(newValue);

  get wizardStep(): WizardStep {
    if (this.type == null) return WizardStep.PickRecipe;
    if (this.wizardPrimaryFieldEntered === true) return WizardStep.Complete;
    switch(this.wizardPrimaryFieldOverride) {
      case "purpose": return WizardStep.EnterPurpose;
      case "rawJson": return WizardStep.EnterRawJson;
      default: return WizardStep.EnterSite;
    }
  }

  get wizardComplete(): boolean {
    return this.wizardStep === WizardStep.Complete && this.type != null
  }

  editingMode: RecipeEditingMode = RecipeEditingMode.NoRecipe;
  setEditingMode = action( (editingMode: RecipeEditingMode) => {
    if (this.editingMode === editingMode) {
      this.editingMode = RecipeEditingMode.NoEdit;
    } else {
      this.editingMode = editingMode;
    }
    if (editingMode === RecipeEditingMode.EditWithTemplateOnly) {
      this.setFieldInFocus("purpose");
    } else if (editingMode === RecipeEditingMode.EditIncludingRawJson) {
      this.setFieldInFocus("rawJson");
    }
  })

  
  toggleEditingMode = (editingMode: RecipeEditingMode) =>
    this.setEditingMode(this.editingMode === editingMode ? RecipeEditingMode.NoEdit : editingMode);

  //////////////////////////////////////////
  // helpToDisplay while building a recipe
  //////////////////////////////////////////
  /**
   * The field to provide help for, or undefined to show help about the
   * type of secret being created
   */
	fieldInFocus?: RecipeFieldType = "purpose";
  setFieldInFocus = action ( (field?: RecipeFieldType) => {
		this.fieldInFocus = field;
	});

  /////////////////////////////////
  // SequenceNumber field ("#")
  /////////////////////////////////
  sequenceNumberState = new NumericTextFieldState({minValue: 2, onChanged: (sequenceNumber) => {
    this.recipeJson = addSequenceNumberToRecipeJson(this.recipeJson, sequenceNumber);
  }});
  get sequenceNumber(): number | undefined { return this.sequenceNumberState.numericValue } 

  /////////////////////////////////////////////////////////////
  // LengthInChars field ("lengthInChars") for Passwords only
  /////////////////////////////////////////////////////////////
  public get lengthInCharsFieldHide(): boolean {
    return false;// this.origin !== "Template";
  }
  get mayEditLengthInChars(): boolean { return this.type === "Password" }
  lengthInCharsState = new NumericTextFieldState({minValue: 16, incrementBy: 4, defaultValue: 64, onChanged: action( (lengthInChars) => {
    this.recipeJson = addLengthInCharsToRecipeJson(this.recipeJson, lengthInChars);
  })});
  get lengthInChars(): number | undefined { return this.lengthInCharsState.numericValue }

  ///////////////////////////////////////////////////////////
  // LengthInBytes field ("lengthInBytes") for Secrets only
  ///////////////////////////////////////////////////////////
  public get lengthInBytesFieldHide(): boolean {
    return this.origin !== "Template";
  }
  get mayEditLengthInBytes(): boolean { return this.type === "Secret" }
  lengthInBytesState = new NumericTextFieldState({minValue: 4, incrementBy: 16, defaultValue: 32, onChanged: action((lengthInBytes) => {
    this.recipeJson = addLengthInBytesToRecipeJson(this.recipeJson, lengthInBytes);
  })});
  get lengthInBytes(): number | undefined { return this.lengthInBytesState.numericValue }

  ////////////////////////////////////
  // Name field ("name") to be saved
  ////////////////////////////////////
  get prescribedName(): string | undefined {
    return this.purpose?.substr(0, 20) ?? this.hosts?.join(", ");
  }

  public name: string = "";
  setName = action ( (name: string) => this.name = name );

  siteTextField?: string = undefined;
  setSiteTextField  = action ( (newValue?: string) => {
    this.siteTextField = newValue;
    const {recipeJson, hosts} = this;
    if (hosts?.length && hosts.length > 0) {
      this.recipeJson = addHostsToRecipeJson(recipeJson, hosts);
    }
  });

  pasteIntoSiteTextField = action( (e: React.ClipboardEvent<HTMLInputElement>) => {
    // If pasting a URL, paste only the domain
    const text = e.clipboardData.getData("text");
    const domain = getRegisteredDomain(text);
    if (domain == null || domain.length == 0) {
      // no valid domain or url pasted so use default paste behavior.
      return;
    }
    // The paste contained a valid domain, so override default paste.
    e.preventDefault();
    if ((this.recipe?.allow ?? []).some( x => x.host === domain)) {
        // The domain has already been included. Don't re-paste it
        return;
    }
    const trimmedField = (this.siteTextField ?? "").trim();
    const connector = trimmedField.length === 0 ? "" :
      trimmedField[trimmedField.length-1] === "," ? " " : ", ";
    this.setSiteTextField(trimmedField + connector +
      // Add a "*." up front if needed
      (domain[0] === "*" || domain[0] === "." ? "" : "*.") +
      domain);
  });

  //////////////////////////////////////////
  // Purpose field ("purpose" or "allow")
  //////////////////////////////////////////
  purposeField?: string;
  /** The purpose of the recipe from the purpose form field if not a list of 1 or more hosts */
  get purpose(): string | undefined { return this.purposeField?.length === 0 ? undefined : this.purposeField; }
  setPurposeField = action ( (newPurposeFieldValue?: string) => {
    this.purposeField = newPurposeFieldValue;
    this.recipeJson = addPurposeToRecipeJson(this.recipeJson, this.purpose);
  });


  /**
   * The hosts for the "allow" restrictions of a recipe if the purpose field contains
   * a URL or list of hosts
   */
  get hosts(): string[] | undefined {
    return parseCommaSeparatedListOfHosts(this.siteTextField);
  }
  get SiteFieldContainsHosts(): boolean { return (this.hosts?.length ?? 0) > 0 }

  ///////////////////////////////////////////////
  // Deriving a recipe from all the form fields
  ///////////////////////////////////////////////
  /**
   * The JSON of the recipe after all user adjustment have been applied
   */
  setRecipeJson = action ( (recipeJson: string | undefined) => {
    if (recipeJson != null) {
      this.setFieldsFromRecipeJson(recipeJson);
    } else {
      this.emptyAllRecipeFields();
    }
    this.recipeJson = recipeJson;
  });

  recipeJson: string | undefined;

  get recipe(): DiceKeysAppSecretRecipe | undefined {
    try {
      const {type, recipeJson} = this;
      if (type != null && recipeJson != null) {
        return JSON.parse(recipeJson) as DiceKeysAppSecretRecipe;
      }
    } catch {}
    return;
  }

  get recipeIsValid(): boolean {
    const {recipe} = this;
    return recipe != null && (
      (recipe.purpose != null && recipe.purpose.length > 0) ||
      (recipe.allow != null && recipe.allow.length > 0)
    );
  }

  get savedRecipeIdentifier(): SavedRecipeIdentifier | undefined {
    const {type, name, recipeJson} = this;
    if (type == null || name == null || recipeJson == null) return;
    const storedRecipe: StoredRecipe = {type, name, recipeJson};
    if (RecipeStore.isRecipeSaved(storedRecipe)) {
      return savedRecipeIdentifier(storedRecipe);
    }
    return;
  }

  get builtInRecipeIdentifier(): BuiltInRecipeIdentifier | undefined {
    const {type, name, recipeJson} = this;
    if (type == null || name == null || recipeJson == null) return;
    const storedRecipe: StoredRecipe = {type, name, recipeJson};
    if (isRecipeBuiltIn(storedRecipe)) {
      return builtInRecipeIdentifier(storedRecipe);
    }
    return;
  }

  get recipeIdentifier(): RecipeIdentifier | undefined {
    return this.savedRecipeIdentifier || this.builtInRecipeIdentifier;
  }

  get areAllRecipeFieldsEmpty(): boolean {
    return this.name == "" &&
      this.purposeField == "" &&
      this.sequenceNumber == null &&
      this.lengthInBytes == null &&
      this.lengthInChars == null
  }

  emptyAllRecipeFields = action (() => {
    this.type = undefined;
    this.recipeJson = undefined;
    this.name = "";
    this.purposeField = undefined;
    this.siteTextField = undefined;
    this.wizardPrimaryFieldEntered = false;
    this.wizardPrimaryFieldOverride = undefined;
    this.sequenceNumberState.textValue = ""
    this.lengthInBytesState.textValue = "";
    this.lengthInCharsState.textValue = ""
  })

  setFieldsFromRecipeJson = action ( (recipeJson: string) => {
    try {
      const {type} = JSON.parse(recipeJson) as Recipe;
      if (type != null) {
        this.type = type;
      }
    } catch {}
    const {purpose, hosts, sequenceNumber, lengthInBytes, lengthInChars} = recipeJsonToAddableFields(recipeJson);
    this.purposeField = purpose;
    this.wizardPrimaryFieldOverride = "rawJson";
    if (purpose != null) {
      this.wizardPrimaryFieldOverride = "purpose";
      this.wizardPrimaryFieldEntered = true;
    }
    if (hosts != null) {
      this.wizardPrimaryFieldOverride = undefined;
      this.wizardPrimaryFieldEntered = true;
      this.siteTextField = hosts.join(", ")
    } else {
      this.siteTextField = undefined;
    }
    this.sequenceNumberState.textValue = sequenceNumber != null ? `${sequenceNumber}` : ""
    this.lengthInBytesState.textValue = lengthInBytes != null ? `${lengthInBytes}` : "";
    this.lengthInCharsState.textValue = lengthInChars != null ? `${lengthInChars}` : ""
  });


  loadRecipe = action ((loadedRecipe?: LoadedRecipe) => {
    if (loadedRecipe == null) return;
    this.emptyAllRecipeFields();
    this.origin = loadedRecipe.origin;
    this.name = loadedRecipe.name ?? "";
    this.type = loadedRecipe.type;
    this.recipeJson = loadedRecipe.recipeJson;
    if (this.recipeJson != null) {
      this.setFieldsFromRecipeJson(this.recipeJson)
    }
    this.editingMode = loadedRecipe.origin === "Saved" || loadedRecipe.origin === "BuiltIn" ?
      RecipeEditingMode.NoEdit :
      RecipeEditingMode.EditWithTemplateOnly;
  });
}
