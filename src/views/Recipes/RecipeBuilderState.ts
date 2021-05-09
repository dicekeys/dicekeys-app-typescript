import { action, makeAutoObservable } from "mobx";
import {
  StoredRecipe, DerivationRecipeType, DiceKeysAppSecretRecipe, purposeToBuiltInRecipe
} from "../../dicekeys/StoredRecipe";
import {
  getRecipeJson,
  purposeToListOfHosts,
  RecipeFieldType
} from "../../dicekeys/ConstructRecipe";
import { NumericTextFieldState } from "../../views/basics/NumericTextFieldView";

/**
 * State for building and displaying recipes
 */
export class RecipeBuilderState {
  constructor() {
    makeAutoObservable(this);
  }

  _type: DerivationRecipeType | undefined;
  get type(): DerivationRecipeType | undefined { return this._type } // ?? this.template?.type ?? this.templateRecipe.type
  setType = action( (type: DerivationRecipeType | undefined) => { this._type = type; } )

  //
  allowEditing?: boolean;


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

  /////////////////////////////////
  // SequenceNumber field ("#")
  /////////////////////////////////
  sequenceNumberState = new NumericTextFieldState({minValue: 2});
  get sequenceNumber(): number | undefined { return this.sequenceNumberState.numericValue } 

  /////////////////////////////////////////////////////////////
  // LengthInChars field ("lengthInChars") for Passwords only
  /////////////////////////////////////////////////////////////
  get mayEditLengthInChars(): boolean { return this.type === "Password" } // && this.templateLengthInChars === undefined
  lengthInCharsState = new NumericTextFieldState({minValue: 16, defaultValue: 64});
  get lengthInChars(): number | undefined { return this.lengthInCharsState.numericValue }

  ///////////////////////////////////////////////////////////
  // LengthInBytes field ("lengthInBytes") for Secrets only
  ///////////////////////////////////////////////////////////
  get mayEditLengthInBytes(): boolean { return this.type === "Secret" } //  && this.templateLengthInBytes === undefined
  lengthInBytesState = new NumericTextFieldState({minValue: 4, incrementBy: 16, defaultValue: 32});
  get lengthInBytes(): number | undefined { return this.lengthInBytesState.numericValue }

  ////////////////////////////////////
  // Name field ("name") to be saved
  ////////////////////////////////////
  get prescribedName(): string | undefined {
    const baseName = this.matchingBuiltInRecipe?.name ?? this.purpose ?? this.hosts?.join(", ");
    if (typeof(baseName) === "undefined") return;
    const sequenceNumber = this.sequenceNumber! > 1  ? ` (${this.sequenceNumber})` : "";
    return `${baseName}${sequenceNumber}`
  }

  public name: string = "";
  get nameToSave(): string | undefined {
    return (this.name.length > 0) ?
      this.name :
      this.prescribedName;
  }
  setName = action ( (name: string) => this.name = name );


  //////////////////////////////////////////
  // Purpose field ("purpose" or "allow")
  //////////////////////////////////////////
  get mayEditPurpose(): boolean { return true };
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
    return getRecipeJson(this);
  }

  get matchingBuiltInRecipe(): StoredRecipe | undefined {
    return purposeToBuiltInRecipe(this.purposeField);
  }

  loadRecipe = action ((savedRecipe?: StoredRecipe) => {
    if (savedRecipe == null) return;
    const template = JSON.parse(savedRecipe.recipeJson ?? "{}") as DiceKeysAppSecretRecipe;
    const {purpose, allow} = template;
    this._type = template.type ?? savedRecipe.type;
    this.name = "";
    // this._nameField = savedRecipe.name;
    this.setPurposeField(
      purpose != null ? purpose :
      allow != null ? allow.map( ({host}) => host.trim() /*
          host.startsWith("*.") ? host.substr(2) : host */
        ).sort().join(", ") :
      this.purposeField
    );
    this.sequenceNumberState.setValue(template["#"]);
    this.lengthInBytesState.setValue(template.lengthInBytes);
    this.lengthInCharsState.setValue(template.lengthInChars);
  });
}
