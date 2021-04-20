import { Recipe } from "@dicekeys/dicekeys-api-js";
import { action, makeAutoObservable } from "mobx";
import { DerivationRecipeTemplateList } from "../../dicekeys/DerivationRecipeTemplateList";
import { RecipeStore } from "~state/stores/RecipeStore";
import { addHostsToRecipeJson, addLengthInCharsToRecipeJson, addPurposeToRecipeJson,
  addSequenceNumberToRecipeJson, SavedRecipe, DerivationRecipeType
} from "../../dicekeys/SavedRecipe";
import { getRegisteredDomain, isValidDomain } from "~domains/get-registered-domain";
import { NumericTextFieldState } from "~views/basics/NumericTextFieldView";

export type PartialSavedRecipe = Pick<SavedRecipe, "type"> & Partial<SavedRecipe>;

export interface PurposeFieldState {
  purpose?: string;
  setPurpose: (purpose?: string) => void
}

const savedPrefix = "saved:";
const templatePrefix = "template:";
type SavedRecipeIdentifier = `${typeof savedPrefix}${string}`;
type TemplateRecipeIdentifier = `${typeof templatePrefix}${string}`;
export const savedRecipeIdentifier = (recipeName: string) => `${savedPrefix}${recipeName}` as SavedRecipeIdentifier;
export const templateRecipeIdentifier = (recipeName: string) => `${templatePrefix}${recipeName}` as TemplateRecipeIdentifier;
const isSavedRecipeIdentifier = (recipeIdentifier?: string): recipeIdentifier is SavedRecipeIdentifier => !!(recipeIdentifier?.startsWith(savedPrefix));
const isTemplateRecipeIdentifier = (recipeIdentifier?: string): recipeIdentifier is TemplateRecipeIdentifier => !!(recipeIdentifier?.startsWith(templatePrefix));

export type SelectedRecipeIdentifier = SavedRecipeIdentifier | TemplateRecipeIdentifier | DerivationRecipeType;

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
    return DerivationRecipeTemplateList.filter( t => t.name === name )[0];
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

export type DiceKeysAppSecretRecipe = Recipe & {
  // FIXME -- definition of recipe out of date in API, fix that and remove this hack
  lengthInChars?: number;
  // Sequence numbers
  '#'?: number;
  purpose?: string;
}

export class RecipeBuilderState implements Partial<SavedRecipe>, /* RecipeTypeState,*/ PurposeFieldState {
  constructor(public selectedRecipeState: SelectedRecipeState) {
    makeAutoObservable(this);
  }
  get template(): PartialSavedRecipe | undefined { return this.selectedRecipeState.template}
  // private _type?: DerivationRecipeType;

//  setTemplate = action ( (template: RecipeTemplate) => this.template = template );
  get templateRecipe(): DiceKeysAppSecretRecipe { return Recipe( this.template?.recipeJson ) }

  get type(): DerivationRecipeType | undefined { return this.template?.type ?? this.templateRecipe.type }


//  get templateSequenceNumber(): number | undefined { return this.templateRecipe["#"] }
  get templateLengthInChars(): number | undefined { return this.templateRecipe.lengthInChars }

  // get mayEditType(): boolean { return !this.template.type }
  //get mayEditSequenceNumber(): boolean { return this.templateSequenceNumber === undefined }
//  private _sequenceNumber = NumericTextFieldState;
  sequenceNumberState = new NumericTextFieldState(2);
//  get sequenceNumber(): number | undefined { return this._sequenceNumber /* ?? this.templateSequenceNumber */ }
  get sequenceNumber(): number | undefined { return this.sequenceNumberState.numericValue } 
  // setSequenceNumber = action( (newSequenceNumber?: number) => {
  //   //if (this.mayEditSequenceNumber) {
  //     this._sequenceNumber = newSequenceNumber;
  //   //}
  // });

  get prescribedPurposeField(): string {
    const {allow, purpose} = this.templateRecipe ?? {} as SavedRecipe;
    if (allow) return allow.map( ({host}) => host ).join(", ");
    return purpose ?? "";
  }

  get mayEditLengthInChars(): boolean { return this.type === "Password" && this.templateLengthInChars === undefined }
  // private _lengthInChars?: number;
  // get lengthInChars(): number | undefined { return this._lengthInChars ?? this.templateLengthInChars }
  // setLengthInChars = action( (newLengthInChars?: number) => {
  //   if (this.mayEditLengthInChars) {
  //     this._lengthInChars = newLengthInChars;
  //   }
  // });
  lengthInCharsState = new NumericTextFieldState(16);
  get lengthInChars(): number | undefined { return this.lengthInCharsState.numericValue }

  get mayEditPurpose(): boolean { return this.templateRecipe.allow === undefined && this.templateRecipe?.purpose === undefined }
  private _purpose?: string;
  get purpose(): string | undefined { return this._purpose ?? this.templateRecipe?.purpose; }
  setPurpose = action ( (purpose?: string) => this._purpose = purpose );


  private _nameField?: string;
  get prescribedName(): string | undefined {
    const baseName = this.template?.name ?? this.purpose ?? this.hosts?.join(", ");
    if (typeof(baseName) === "undefined") return;
    const sequenceNumber = this.sequenceNumber! > 1  ? ` (${this.sequenceNumber})` : "";
    return `${baseName}${sequenceNumber}`
  }

  setName = action ( (name: string) => this._nameField = name );
  get name(): string | undefined {
    return (typeof (this._nameField) !== "undefined" && this._nameField.length > 0) ?
      this._nameField :
      this.prescribedName;
    }

  get hosts(): string[] | undefined {
    try {
      // If the host field contains a valid URL, return the host name
      return [new URL(this.purpose ?? "").hostname];
    } catch {}
    // Return a list of valid domains
    try {
      const hosts = (this.purpose ?? "").split(",")
        .map( i => {
          const potentialHostName = i.trim();
          // Get JavaScript's URL parser to validate the hostname for us
          if (isValidDomain(potentialHostName)) {
            return getRegisteredDomain(potentialHostName);
          } else throw "not a valid host name"
        })
        .filter( i =>  i ) as string[];
        if (hosts.length > 0) {
          return hosts;
        }
    } catch {}
    const {allow} = this.templateRecipe;
    if (allow && allow.length! > 0) {
      return allow.map(({host}) => host)
    }
    return undefined;
  }
  get purposeContainsHosts(): boolean { return (this.hosts?.length ?? 0) > 0 }

  get recipeJson(): string | undefined {
    let recipeJson: string | undefined = this.template?.recipeJson;
    if (this.mayEditPurpose) {
      const hosts = this.hosts;
      if (hosts) {
        recipeJson = addHostsToRecipeJson(recipeJson, hosts);
      } else if ((this.purpose?.length ?? 0) > 0) {
        recipeJson = addPurposeToRecipeJson(recipeJson, this.purpose);
      }
    }
    if (this.mayEditLengthInChars && this.lengthInChars! > 0) {
      recipeJson = addLengthInCharsToRecipeJson(recipeJson, this.lengthInChars);
    }
    if ((this.sequenceNumber ?? 1) > 1) {
      recipeJson = addSequenceNumberToRecipeJson(recipeJson, this.sequenceNumber);
    }
    return recipeJson;
  }

}