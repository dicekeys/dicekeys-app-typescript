import {ParsedJsonElement, parseAnnotatedJson} from "../utilities/jsonParser";

const compareObjectFieldNames = (a: string, b: string) =>
  // The "#" (sequence number) field always comes last
  a === "#" ? 1 :
  b === "#" ? -1 :
  // The "purpose" field always comes first
  a === "purpose" ? - 1 :
  b === "purpose" ? 1 :
  // Otherwise, sort in alphabetical order
  a < b ? -1 :
  b < a ? 1 :
  0;

const toCanonicalizeRecipeJson = ( parsedJson: ParsedJsonElement ): string => {
  switch(parsedJson.type) {
    case "number": return parsedJson.numberAsString;
    case "string": return parsedJson.originalQuotedString;
    case "null": return "null";
    case "boolean": return parsedJson.value.toString();
    case "array": return `[${parsedJson.fields.map((e) => toCanonicalizeRecipeJson(e.value)).join(",")}]`;
    case "object": return `{${
        parsedJson.fields
          .sort( (a, b) => compareObjectFieldNames(a.name.value, b.name.value)  )
          .map( field => `"${field.name.value}":${toCanonicalizeRecipeJson(field.value)}`)
          .join(",")
      }}`;
  }
}

export const canonicalizeRecipeJson = (recipeJson: string | undefined): string | undefined => {
  if (recipeJson == null) return undefined;
  try {
    const recipeJsonObj = parseAnnotatedJson(recipeJson);
    if (recipeJsonObj.type != "object") throw new Error("recipe must be object");
    return toCanonicalizeRecipeJson(recipeJsonObj);
  } catch (e) {
    console.log(e);
    return undefined;;
  }
}