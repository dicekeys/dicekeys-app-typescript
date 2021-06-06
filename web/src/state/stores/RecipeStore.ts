import {
  StoredRecipe} from "../../dicekeys/StoredRecipe";
import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../core/AutoSave";
import { jsonStringifyWithSortedFieldOrder } from "../../utilities/json";

class RecipeStoreClass {
  protected recipeJsonArray: string[];

  get recipeJsonSet(): Set<string> { return new Set(this.recipeJsonArray) }

  addRecipe = action ( (storedRecipe: StoredRecipe) => {
    const {recipeJsonSet} = this;
    recipeJsonSet.add(jsonStringifyWithSortedFieldOrder(storedRecipe));
    this.recipeJsonArray = [...recipeJsonSet.values()];
  });

  removeRecipe = action ( (storedRecipe: StoredRecipe) => {
    const {recipeJsonSet} = this;
    recipeJsonSet.delete(jsonStringifyWithSortedFieldOrder(storedRecipe));
    this.recipeJsonArray = [...recipeJsonSet.values()];
  });

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.recipeJsonArray = []
  });

  get recipes(): StoredRecipe[] {
    return this.recipeJsonArray.map(
      json => JSON.parse(json) as StoredRecipe
    ).sort( (a, b) => 
      a.name != b.name ? (a.name < b.name ? -1 : 1) :
      a.type != b.type ? (a.type < b.type ? -1 : 1) :
      a.recipeJson < b.recipeJson ? - 1 : 1
    )
  }
 
  isRecipeSaved = (recipeToStore: StoredRecipe): boolean =>
    !!this.recipes.find( savedRecipe =>
      recipeToStore.recipeJson === savedRecipe.recipeJson &&
      recipeToStore.type === savedRecipe.type  &&
      recipeToStore.name === savedRecipe.name
    )

  constructor() {
    this.recipeJsonArray = [];
    makeAutoObservable(this);
    autoSave(this, "RecipeStore");
  }
}
export const RecipeStore = new RecipeStoreClass();
