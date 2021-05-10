import { action, makeAutoObservable } from "mobx";
import {
  StoredRecipe, DerivationRecipeType, purposeToBuiltInRecipe
} from "../../dicekeys/StoredRecipe";
import {
  getRecipeJson,
  hostsToPurpose,
  isRecipeJsonConstructableFromFields,
  purposeToListOfHosts,
  RecipeFieldType,
  recipeJsonToAddableFields
} from "../../dicekeys/ConstructRecipe";
import { NumericTextFieldState } from "../../views/basics/NumericTextFieldView";
import { Recipe } from "@dicekeys/dicekeys-api-js";

type EditingMode = "fields" | "json" | undefined;

/**
 * State for building and displaying recipes
 */
export class RecipeBuilderState {
  constructor() {
    makeAutoObservable(this);
  }

  type: DerivationRecipeType | undefined;
  setType = action( (type: DerivationRecipeType | undefined) => {
    this.type = type;
  } )

  //
  editing: boolean = true;
  get editingMode(): EditingMode { return this.editing ? (this.recipeJsonField != null ? "json" : "fields" ) : undefined };
  get mayEditFields(): boolean {
    const recipeJson = this.recipeJsonField;
    return recipeJson != null && isRecipeJsonConstructableFromFields(recipeJson)
  }
  setStartEditingFields = action ( () => {
    const recipeJson = this.recipeJsonField;
    if (recipeJson != null && isRecipeJsonConstructableFromFields(recipeJson)) {
      this.setFieldsFromRecipeJson(recipeJson);
    }
    this.editing = true;  
  });
  setStartEditingRawJson = action ( () => {
    if (this.recipeJsonField == null) {
      this.recipeJsonField = getRecipeJson(this) ?? "{}";
    }
    this.editing = true;
  });
  setStartEditing = action( () => {
    if (this.mayEditFields) {
      this.setStartEditingFields();
    } else {
      this.setStartEditingRawJson();
    }
  })

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
  get mayEditLengthInChars(): boolean { return this.type === "Password" }
  lengthInCharsState = new NumericTextFieldState({minValue: 16, defaultValue: 64});
  get lengthInChars(): number | undefined { return this.lengthInCharsState.numericValue }

  ///////////////////////////////////////////////////////////
  // LengthInBytes field ("lengthInBytes") for Secrets only
  ///////////////////////////////////////////////////////////
  get mayEditLengthInBytes(): boolean { return this.type === "Secret" }
  lengthInBytesState = new NumericTextFieldState({minValue: 4, incrementBy: 16, defaultValue: 32});
  get lengthInBytes(): number | undefined { return this.lengthInBytesState.numericValue }

  ////////////////////////////////////
  // Name field ("name") to be saved
  ////////////////////////////////////
  get prescribedName(): string | undefined {
    return this.matchingBuiltInRecipe?.name ?? this.purpose?.substr(0, 20) ?? this.hosts?.join(", ");
  }

  public name: string = "";
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
  recipeJsonField: string | undefined;
  setRecipeJson = action ( (recipeJson: string) => {
    this.recipeJsonField = recipeJson;
    this.setFieldsFromRecipeJson(recipeJson);
  });
  get prescribedRecipeJson(): string | undefined {
    return getRecipeJson(this);
  }
  get recipeJson(): string | undefined {
    return this.recipeJsonField ?? getRecipeJson(this);
  }
  

  get matchingBuiltInRecipe(): StoredRecipe | undefined {
    return purposeToBuiltInRecipe(this.purposeField);
  }

  get areAllRecipeFieldsEmpty(): boolean {
    return this.name == "" &&
      this.purposeField == "" &&
      this.sequenceNumber == null &&
      this.lengthInBytes == null &&
      this.lengthInChars == null
  }

  emptyAllRecipeFields = action (() => {
    this.name = "";
    this.purposeField = "";
    this.sequenceNumberState.setValue(undefined);
    this.lengthInBytesState.setValue(undefined);
    this.lengthInCharsState.setValue(undefined);
  })

  setFieldsFromRecipeJson = action ( (recipeJson: string) => {
    const {type} = JSON.parse(recipeJson) as Recipe;
    if (type != null) {
      this.type = type;
    }
    const recipeFields = recipeJsonToAddableFields(recipeJson);
    const {purpose, hosts} = recipeFields;
    if (purpose != null) {
      this.setPurposeField(purpose)
    } else if (hosts != null) {
      this.setPurposeField(hostsToPurpose(hosts))      
    }
    this.sequenceNumberState.setValue(recipeFields.sequenceNumber);
    this.lengthInBytesState.setValue(recipeFields.lengthInBytes);
    this.lengthInCharsState.setValue(recipeFields.lengthInChars);
  });

  loadRecipe = action ((storedRecipe?: StoredRecipe) => {
    if (storedRecipe == null) return;
    this.emptyAllRecipeFields();
    this.name = storedRecipe.name;
    this.type = storedRecipe.type;
    this.editing = false;
    this.setRecipeJson(storedRecipe.recipeJson);
    // const template = JSON.parse(storedRecipe.recipeJson ?? "{}") as DiceKeysAppSecretRecipe;
    // const {purpose, allow} = template;
    // this.type = template.type ?? storedRecipe.type;
    // this.setPurposeField(
    //   purpose != null ? purpose :
    //   allow != null ? allow.map( ({host}) => host.trim() /*
    //       host.startsWith("*.") ? host.substr(2) : host */
    //     ).sort().join(", ") :
    //   this.purposeField
    // );
    // this.sequenceNumberState.setValue(template["#"]);
    // this.lengthInBytesState.setValue(template.lengthInBytes);
    // this.lengthInCharsState.setValue(template.lengthInChars);
  });
}
