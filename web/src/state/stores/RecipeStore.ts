import {
  StoredRecipe,
  defaultOnException,
  recipeDefaultBaseName,
} from "../../dicekeys/StoredRecipe";
import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../core/AutoSave";
import { jsonStringifyWithSortedFieldOrder } from "../../utilities/json";

class RecipeStoreClass {
  protected recipeJsonArray: string[];

  get recipeJsonSet(): Set<string> { return new Set(this.recipeJsonArray) }

  addRecipe = action ( (storedRecipe: StoredRecipe) => {
    this.removeRecipe(storedRecipe);
    this.recipeJsonArray.push(jsonStringifyWithSortedFieldOrder(storedRecipe));
  });

  removeRecipe = action ( (storedRecipeToRemove: StoredRecipe) => {
    this.recipeJsonArray = [...this.recipeJsonArray].filter( (recipeJson) => {
      // Filter out (return false) any matching recipes
      try {
        const storedRecipe = JSON.parse(recipeJson) as StoredRecipe
        return storedRecipeToRemove.recipeJson !== storedRecipe.recipeJson ||
          storedRecipeToRemove.type !== storedRecipe.type;
      } catch {
        return false;
      }
    });
  });

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.recipeJsonArray = []
  });

  get recipes(): StoredRecipe[] {
    return this.recipeJsonArray.map(
      json => JSON.parse(json) as StoredRecipe
    ).sort( (a, b): number => {
      const aName = a.name ?? defaultOnException(() => recipeDefaultBaseName(JSON.parse(a.recipeJson))) ?? "";
      const bName = b.name ?? defaultOnException(() => recipeDefaultBaseName(JSON.parse(b.recipeJson))) ?? "";
      return aName != bName ? ((aName < bName) ? -1 : 1) :
        a.type != b.type ? (a.type < b.type ? -1 : 1) :
        a.recipeJson < b.recipeJson ? - 1 : 1
    })
  }
 
  isRecipeSaved = (recipeToStore: StoredRecipe): boolean =>
    !!this.recipes.find( savedRecipe =>
      recipeToStore.recipeJson === savedRecipe.recipeJson &&
      recipeToStore.type === savedRecipe.type
    )

  constructor() {
    this.recipeJsonArray = [];
    makeAutoObservable(this);
    autoSave(this, "RecipeStore");
  }
}
export const RecipeStore = new RecipeStoreClass();
