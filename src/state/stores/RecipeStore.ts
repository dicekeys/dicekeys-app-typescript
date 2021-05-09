import {
  StoredRecipe} from "../../dicekeys/StoredRecipe";
import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../core/AutoSave";

export const RecipeStore = new (class RecipeStore {
  protected recipesByName: Record<string, StoredRecipe>;

  addRecipe = action ( (recipe: StoredRecipe) => {
    this.recipesByName[recipe.name] = recipe;
  });

  removeRecipeByName = action ( (recipeName: string) => {
    delete this.recipesByName[recipeName];
  });

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.recipesByName = {}
  });

  get names(): string[] { return Object.keys(this.recipesByName).sort() }

  get recipes() {
    return Object.values(this.recipesByName)
      .sort( (a, b) => a.name < b.name ? -1 : 1 );
  }
 
  recipeForName = (recipeName: string): StoredRecipe | undefined => {
    const result = this.recipesByName[recipeName];
    return result;
  }

  constructor() {
    this.recipesByName = {};
    makeAutoObservable(this);
    autoSave(this, "RecipeStore");
  }
})();
