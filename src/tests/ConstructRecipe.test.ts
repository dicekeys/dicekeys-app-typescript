import { addLengthInBytesToRecipeJson } from "../dicekeys/ConstructRecipe";

describe("Construct Recipes", () => {
  
  test("addLengthInBytesToRecipeJson - replace 3 with 68 ", () => {
    const preJson = `{"lengthInBytes": 3, "#":7 }`
    const postJson = addLengthInBytesToRecipeJson(preJson, 68)
    expect(postJson).toStrictEqual(`{"lengthInBytes": 68, "#":7 }`)
  });

  test("addLengthInBytesToRecipeJson - replace lengthInBytes of 3 with 32 which should be removed", () => {
    const preJson = `{"lengthInBytes": 3, "#":7 }`
    const postJson = addLengthInBytesToRecipeJson(preJson, 32)
    expect(postJson).toStrictEqual(`{ "#":7 }`)
  });
    
  test("addLengthInBytesToRecipeJson - append lengthInBytes if not present", () => {
    const preJson = `{"#":7 }`
    const postJson = addLengthInBytesToRecipeJson(preJson, 68)
    expect(postJson).toStrictEqual(`{"#":7 ,"lengthInBytes":68}`)
  });


});