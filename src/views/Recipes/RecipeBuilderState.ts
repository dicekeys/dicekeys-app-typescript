import { action, makeAutoObservable } from "mobx";
import { RecipeStore } from "~state/stores/RecipeStore";
import {
  BuiltInRecipes,
  SavedRecipe, DerivationRecipeType, DiceKeysAppSecretRecipe, RecipeFieldType, getRecipeJson,
  purposeToListOfHosts,
  purposeToBuiltInRecipe
} from "../../dicekeys/SavedRecipe";
import { NumericTextFieldState } from "~views/basics/NumericTextFieldView";
import { CachedApiCalls } from "~api-handler/CachedApiCalls";

const spaceJson = (spaces: number = 2) => (json: string | undefined): string | undefined => {
  return (json == null) ? json : JSON.stringify(JSON.parse(json), undefined, spaces);
}
const doubleSpaceJson = spaceJson(2);

export type PartialSavedRecipe = Pick<SavedRecipe, "type"> & Partial<SavedRecipe>;

export interface PurposeFieldState {
  purposeField?: string;
  setPurposeField: (purpose?: string) => void
}


export const OutputFormats = {
  "Password": ["Password", "JSON"],
  "Secret": ["JSON", "Hex", "BIP39"],
  "SigningKey": ["JSON", "Hex (Signing Key)", /* "Hex (Signature-Verification Key)" */],
  "SymmetricKey": ["JSON", "Hex"],
  "UnsealingKey": ["JSON", "Hex (Unsealing Key)", "Hex (Sealing Key)"],
} as const;
type OutputFormats = typeof OutputFormats;
export type OutputFormat<T extends DerivationRecipeType> = OutputFormats[T][number]
export type OutputFormatForType<T extends DerivationRecipeType = DerivationRecipeType> = {[type in T]: OutputFormat<T>}
( () => {
  const TypeCheckOutputFormats: Record<DerivationRecipeType, readonly string[]> = OutputFormats;
  if (false) console.log(`${TypeCheckOutputFormats}`)
})
const DefaultOutputFormat: OutputFormatForType =  {
  "Password": "Password",
  "Secret": "JSON",
  "SigningKey": "JSON",
  "SymmetricKey": "JSON",
  "UnsealingKey": "JSON",
} as const
export const outputFormats = <T extends DerivationRecipeType>(type: T): OutputFormats[T]  => OutputFormats[type];



const savedPrefix = "saved:";
const templatePrefix = "template:";
type SavedRecipeIdentifier = `${typeof savedPrefix}${string}`;
type TemplateRecipeIdentifier = `${typeof templatePrefix}${string}`;
export const savedRecipeIdentifier = (recipeName: string) => `${savedPrefix}${recipeName}` as SavedRecipeIdentifier;
export const templateRecipeIdentifier = (recipeName: string) => `${templatePrefix}${recipeName}` as TemplateRecipeIdentifier;
const isSavedRecipeIdentifier = (recipeIdentifier?: string): recipeIdentifier is SavedRecipeIdentifier => !!(recipeIdentifier?.startsWith(savedPrefix));
const isTemplateRecipeIdentifier = (recipeIdentifier?: string): recipeIdentifier is TemplateRecipeIdentifier => !!(recipeIdentifier?.startsWith(templatePrefix));

export type SelectedRecipeIdentifier = SavedRecipeIdentifier | TemplateRecipeIdentifier | DerivationRecipeType;

/**
 * State for the currently-selected recipe
 */
export class SelectedRecipeState {
  recipeIdentifier?: SelectedRecipeIdentifier;

  setSelectedRecipeIdentifier = action ( (selectedRecipeIdentifier?: SelectedRecipeIdentifier) => {
    this.recipeIdentifier = selectedRecipeIdentifier
  });

  get isSaved(): boolean { return isSavedRecipeIdentifier(this.recipeIdentifier) }
  get isTemplate(): boolean { return isTemplateRecipeIdentifier(this.recipeIdentifier) }

  get savedRecipe(): SavedRecipe | undefined {
    if (!isSavedRecipeIdentifier(this.recipeIdentifier)) return;
    return RecipeStore.recipeForName(this.recipeIdentifier.substr(savedPrefix.length))
  }

  get templateRecipe(): SavedRecipe | undefined {
    if (!isTemplateRecipeIdentifier(this.recipeIdentifier)) return;
    const name = this.recipeIdentifier.substr(templatePrefix.length);
    return BuiltInRecipes.filter( t => t.name === name )[0];
  }

  get template(): PartialSavedRecipe | undefined {
    const {recipeIdentifier} = this;
    if (isSavedRecipeIdentifier(recipeIdentifier)) {
      return this.savedRecipe;
    } else if (isTemplateRecipeIdentifier(recipeIdentifier)) {
      return this.templateRecipe;
    } else if (recipeIdentifier !== undefined) {
      return {type: recipeIdentifier, recipeJson: ""}
    } else {
      return;
    }
  }

  constructor() {
    makeAutoObservable(this);
  }
}




export class RecipeFieldHelpState {

	constructor() {
		makeAutoObservable(this);
	}
}


/**
 * State for building and displaying recipes
 */
export class RecipeBuilderState implements Partial<SavedRecipe>, /* RecipeTypeState,*/ PurposeFieldState {
  constructor(public selectedRecipeState: SelectedRecipeState, protected readonly cachedApiCalls: CachedApiCalls) {
    makeAutoObservable(this);
  }
  // get template(): PartialSavedRecipe | undefined { return this.selectedRecipeState.template}

	// get templateRecipe(): DiceKeysAppSecretRecipe { return Recipe( this.template?.recipeJson ) }

  _type: DerivationRecipeType | undefined;
  get type(): DerivationRecipeType | undefined { return this._type } // ?? this.template?.type ?? this.templateRecipe.type
  setType = action( (type: DerivationRecipeType | undefined) => { this._type = type; } )

  //////////////////////////////////////////
  // helpToDisplay while building a recipe
  //////////////////////////////////////////
  /**
   * The field to provide help for, or undefined to show help about the
   * type of secret being created
   */
	helpToDisplay?: RecipeFieldType;
	showHelpFor = action ( (recipeField?: RecipeFieldType) => {
		this.helpToDisplay = recipeField;
	} )
	showHelpForFn = (recipeField?: RecipeFieldType) => () => this.showHelpFor(recipeField);

  //////////////////////////////////////////
  // outputField to derive from recipe
  //////////////////////////////////////////  
  outputFieldForType: OutputFormatForType = {...DefaultOutputFormat};
  outputFieldFor = <T extends DerivationRecipeType>(t: T): OutputFormat<T> => this.outputFieldForType[t];
  setOutputField = action ( (value: OutputFormat<DerivationRecipeType>) => {
    const recipeType = this.type;
    if (recipeType != null && (OutputFormats[recipeType] as readonly string[]).indexOf(value) != -1) {
      this.outputFieldForType[recipeType] = value;
    }
  });
  setOutputFieldTo = (value: OutputFormat<DerivationRecipeType>) => () => this.setOutputField(value);

  /////////////////////////////////
  // SequenceNumber field ("#")
  /////////////////////////////////
  sequenceNumberState = new NumericTextFieldState({minValue: 2});
  get sequenceNumber(): number | undefined { return this.sequenceNumberState.numericValue } 

  /////////////////////////////////////////////////////////////
  // LengthInChars field ("lengthInChars") for Passwords only
  /////////////////////////////////////////////////////////////
//  get templateLengthInChars(): number | undefined { return this.type !== "Password" ? undefined : this.templateRecipe.lengthInChars }
  get mayEditLengthInChars(): boolean { return this.type === "Password" } // && this.templateLengthInChars === undefined
  lengthInCharsState = new NumericTextFieldState({minValue: 16, defaultValue: 64});
  get lengthInChars(): number | undefined { return this.lengthInCharsState.numericValue }

  ///////////////////////////////////////////////////////////
  // LengthInBytes field ("lengthInBytes") for Secrets only
  ///////////////////////////////////////////////////////////
//  get templateLengthInBytes(): number | undefined { return this.type !== "Secret" ? undefined : this.templateRecipe.lengthInBytes }
  get mayEditLengthInBytes(): boolean { return this.type === "Secret" } //  && this.templateLengthInBytes === undefined
  lengthInBytesState = new NumericTextFieldState({minValue: 4, incrementBy: 16, defaultValue: 32});
  get lengthInBytes(): number | undefined { return this.lengthInBytesState.numericValue }

  /////////////////////////////////
  // Name field ("name")
  /////////////////////////////////
  private _nameField?: string;
  get prescribedName(): string | undefined {
    const baseName = purposeToBuiltInRecipe(this.purposeField)?.name ?? this.purpose ?? this.hosts?.join(", ");
    if (typeof(baseName) === "undefined") return;
    const sequenceNumber = this.sequenceNumber! > 1  ? ` (${this.sequenceNumber})` : "";
    return `${baseName}${sequenceNumber}`
  }

  /**
   * The name of the recipe to save
   */
  get name(): string | undefined {
    return (typeof (this._nameField) !== "undefined" && this._nameField.length > 0) ?
      this._nameField :
      this.prescribedName;
  }
  setName = action ( (name: string) => this._nameField = name );


  //////////////////////////////////////////
  // Purpose field ("purpose" or "allow")
  //////////////////////////////////////////
  // get prescribedPurposeField(): string {
  //   const {allow, purpose} = this.templateRecipe ?? {} as SavedRecipe;
  //   if (allow) return allow.map( ({host}) => host ).join(", ");
  //   return purpose ?? "";
  // }

  get mayEditPurpose(): boolean { return true }; //return this.templateRecipe.allow === undefined && this.templateRecipe?.purpose === undefined }
  purposeField?: string;
  /** The purpose of the recipe from the purpose form field if not a list of 1 or more hosts */
  get purpose(): string | undefined { return this.hosts ? undefined : this.purposeField; } // ?? this.templateRecipe?.purpose;
  setPurposeField = action ( (newPurposeFieldValue?: string) => this.purposeField = newPurposeFieldValue );


  /**
   * The hosts for the "allow" restrictions of a recipe if the purpose field contains
   * a URL or list of hosts
   */
  get hosts(): string[] | undefined { return purposeToListOfHosts(this.purposeField); }
  get purposeContainsHosts(): boolean { return (this.hosts?.length ?? 0) > 0 }

  ///////////////////////////////////////////////
  // Deriving a recipe from all the form fields
  ///////////////////////////////////////////////
  /**
   * The JSON of the recipe after all user adjustment have been applied
   */
  get recipeJson(): string | undefined {
    return getRecipeJson(this); // , this.template?.recipeJson);
  }

  loadSavedRecipe = action ((savedRecipe: SavedRecipe) => {
    const template = JSON.parse(savedRecipe.recipeJson) as DiceKeysAppSecretRecipe;
    const {purpose, allow} = template;
    this._type = template.type ?? savedRecipe.type;
    // this._nameField = savedRecipe.name;
    this.setPurposeField(
      purpose != null ? purpose :
      allow != null ? allow.map( ({host}) =>
          host.startsWith("*.") ? host.substr(2) : host
        ).sort().join(", ") :
      this.purposeField
    );
      this.sequenceNumberState.setValue(template["#"]);
      this.lengthInBytesState.setValue(template.lengthInBytes);
    this.lengthInCharsState.setValue(template.lengthInChars);
  });


  ////////////////
  get derivedValue(): string | undefined {
    const {type, recipeJson} = this;
    const api = this.cachedApiCalls;
    if (!recipeJson || !type) { return; }
  
    switch (type) {
      case "Password":
        switch (this.outputFieldFor("Password")) {
          case "Password":
            return api.getPasswordForRecipe(recipeJson);
          case "JSON":
            return doubleSpaceJson(api.getPasswordJsonForRecipe(recipeJson))
        }
      case "Secret":
        switch (this.outputFieldFor("Secret")) {  // FIXME -- format JSON
          case "BIP39":
            return api.getSecretBip39ForRecipe(recipeJson);
          case "Hex":
            return api.getSecretHexForRecipe(recipeJson);
          case "JSON":
            return doubleSpaceJson(api.getSecretJsonForRecipe(recipeJson));
        }
      case "SymmetricKey":
        switch (this.outputFieldFor("SymmetricKey")) {
          case "Hex":
            return api.getSymmetricKeyHexForRecipe(recipeJson);
          case "JSON":
            return doubleSpaceJson(api.getSymmetricKeyJsonForRecipe(recipeJson));
        }
      case "UnsealingKey":
        switch (this.outputFieldFor("UnsealingKey")) {
          case "Hex (Unsealing Key)":
            return api.getUnsealingKeyHexForRecipe(recipeJson);
          case "Hex (Sealing Key)":
            return api.getUnsealingKeyHexForRecipe(recipeJson);
          case "JSON":
            return doubleSpaceJson(api.getUnsealingKeyJsonForRecipe(recipeJson));
        }
      case "SigningKey":
        switch (this.outputFieldFor("SigningKey")) {
          case "Hex (Signing Key)":
            return api.getSigningKeyHexForRecipe(recipeJson);
          case "JSON":
            return doubleSpaceJson(api.getSigningKeyJsonForRecipe(recipeJson));
        }
    }
  };
}

