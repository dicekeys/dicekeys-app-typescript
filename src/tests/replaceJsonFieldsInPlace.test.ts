import { modifyJson } from "../utilities/modifyJson";


describe("replaceJsonFieldsInPlace", () => {
  
  test("Change top level number with white space after", () => {
    const preJson = `{"x": 3 }`
    const postJson = modifyJson(preJson, ({key, value, replaceValueWithNewValue: replaceWithNewValue}) => {
      if (key === `["x"]` && value == 3) {
        replaceWithNewValue(5);
      }
    })
    expect(postJson).toStrictEqual(`{"x": 5 }`)
  });

  test("Change second level number", () => {
    const preJson = `{"y": {"x": 3}}`
    const postJson = modifyJson(preJson, ({key, replaceValueWithNewValue: replaceWithNewValue}) => {
      if (key === `["y"]["x"]`) {
        replaceWithNewValue(6);
      }
    })
    expect(postJson).toStrictEqual(`{"y": {"x": 6}}`)
  });

  test("Change second level number to object", () => {
    const preJson = `{"y": {"x": 3}}`
    const postJson = modifyJson(preJson, ({key, replaceValueWithNewValue: replaceWithNewValue}) => {
      if (key === `["y"]["x"]`) {
        replaceWithNewValue({text:"hi"});     
      }
    });
    expect(postJson).toStrictEqual(`{"y": {"x": {"text":"hi"}}}`)
  });

  test("Change top level string", () => {
    const preJson = `{ "foo" : "bar" }`
    const postJson = modifyJson(preJson, ({key, value, replaceValueWithNewValue: replaceWithNewValue}) => {
     if (key === `["foo"]` && value == "bar") {
       replaceWithNewValue("baz");
      }
    })
    expect(postJson).toStrictEqual(`{ "foo" : "baz" }`)
  });

});