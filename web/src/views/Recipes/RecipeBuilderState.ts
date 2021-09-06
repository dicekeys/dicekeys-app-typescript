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
  PickAddressVsPurpose = 1,
  EnterAddressOrPurpose = 2,
  EditAllFields = 3,
  EditRawJson = 4,
  DoneEditing = 5
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


  usePurposeOrAllow?: "purpose" | "allow" | undefined;
  setUsePurposeOrAllow = action( (newValue: "purpose" | "allow" | undefined) => {
    this.usePurposeOrAllow = newValue;
  })
  setUsePurposeOrAllowFn = (newValue: "purpose" | "allow" | undefined) =>
    () => this.setUsePurposeOrAllow(newValue);

  purposeOrAssociatedDomainsEntered?: boolean;
  setPurposeOrAssociatedDomainsEntered = action( (newValue: boolean | undefined) => {
    this.purposeOrAssociatedDomainsEntered = newValue;
  })
  setPurposeOrAssociatedDomainsEnteredFn = (newValue: boolean | undefined) =>
    () => this.setPurposeOrAssociatedDomainsEntered(newValue);

  get wizardStep(): WizardStep {
    if (this.type == null) return WizardStep.PickRecipe;
    if (this.usePurposeOrAllow == null) return WizardStep.PickAddressVsPurpose;
    if (!this.purposeOrAssociatedDomainsEntered) return WizardStep.EnterAddressOrPurpose;
    switch(this.editingMode) {
      case RecipeEditingMode.NoEdit: return WizardStep.DoneEditing;
      case RecipeEditingMode.EditWithTemplateOnly: return WizardStep.EditAllFields;
      case RecipeEditingMode.EditIncludingRawJson: return WizardStep.EditRawJson;
      case RecipeEditingMode.NoRecipe: return WizardStep.PickRecipe;
    }
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

  associatedDomainsTextField: string = "";
  setAssociatedDomainsTextField  = action ( (newValue: string) => {
    this.associatedDomainsTextField = newValue;
    const {recipeJson, hosts} = this;
    if (hosts?.length && hosts.length > 0) {
      this.recipeJson = addHostsToRecipeJson(recipeJson, hosts);
    }
  });

  pasteIntoAssociatedDomainsTextField = action( (e: React.ClipboardEvent<HTMLInputElement>) => {
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
    const trimmedField = (this.associatedDomainsTextField ?? "").trim();
    const connector = trimmedField.length === 0 ? "" :
      trimmedField[trimmedField.length-1] === "," ? " " : ", ";
    this.setAssociatedDomainsTextField(trimmedField + connector + domain);
  });

  //////////////////////////////////////////
  // Purpose field ("purpose" or "allow")
  //////////////////////////////////////////
  purposeField: string = "";
  /** The purpose of the recipe from the purpose form field if not a list of 1 or more hosts */
  get purpose(): string | undefined { return this.purposeField?.length === 0 ? undefined : this.purposeField; }
  setPurposeField = action ( (newPurposeFieldValue: string) => {
    this.purposeField = newPurposeFieldValue;
    this.recipeJson = addPurposeToRecipeJson(this.recipeJson, this.purpose);
  });


  /**
   * The hosts for the "allow" restrictions of a recipe if the purpose field contains
   * a URL or list of hosts
   */
  get hosts(): string[] | undefined { return parseCommaSeparatedListOfHosts(this.associatedDomainsTextField); }
  get associatedDomainsFieldContainsHosts(): boolean { return (this.hosts?.length ?? 0) > 0 }

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

  get savedRecipeIdentifer(): SavedRecipeIdentifier | undefined {
    const {type, name, recipeJson} = this;
    if (type == null || name == null || recipeJson == null) return;
    const storedRecipe: StoredRecipe = {type, name, recipeJson};
    if (RecipeStore.isRecipeSaved(storedRecipe)) {
      return savedRecipeIdentifier(storedRecipe);
    }
    return;
  }

  get builtInRecipeIdentifer(): BuiltInRecipeIdentifier | undefined {
    const {type, name, recipeJson} = this;
    if (type == null || name == null || recipeJson == null) return;
    const storedRecipe: StoredRecipe = {type, name, recipeJson};
    if (isRecipeBuiltIn(storedRecipe)) {
      return builtInRecipeIdentifier(storedRecipe);
    }
    return;
  }

  get recipeIdentifier(): RecipeIdentifier | undefined {
    return this.savedRecipeIdentifer || this.builtInRecipeIdentifer;
  }

  get areAllRecipeFieldsEmpty(): boolean {
    return this.name == "" &&
      this.purposeField == "" &&
      this.sequenceNumber == null &&
      this.lengthInBytes == null &&
      this.lengthInChars == null
  }

  emptyAllRecipeFields = action (() => {
    this.recipeJson = undefined;
    this.name = "";
    this.purposeField = "";
    this.associatedDomainsTextField = "";
    this.purposeOrAssociatedDomainsEntered = false;
    this.usePurposeOrAllow = undefined;
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
    if (purpose != null) {
      this.purposeField = purpose;
      this.usePurposeOrAllow = "purpose";
      this.purposeOrAssociatedDomainsEntered = true;
    }
    if (hosts != null) {
      this.usePurposeOrAllow = "allow";
      this.purposeOrAssociatedDomainsEntered = true;
      this.associatedDomainsTextField = hosts.join(", ")
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
    this.setRecipeJson(loadedRecipe.recipeJson);
    this.setEditingMode(
      loadedRecipe.origin === "Saved" || loadedRecipe.origin === "BuiltIn" ?
        RecipeEditingMode.NoEdit :
        RecipeEditingMode.EditWithTemplateOnly
    );
  });
}
