
export const findIndexAndLength = (original: string, searchFor: string | RegExp): {index: number, length: number} | undefined => {
  if (typeof searchFor === "string") {
    const index = original.indexOf(searchFor);
    return (index < 0) ? undefined : {index, length: searchFor.length};
  } else {
//    const [matchResult] = original.match(searchFor); 
    const matchResult = original.match(searchFor);
    if (matchResult == null || matchResult.index == null) return undefined;
    return {index: matchResult.index, length: matchResult[0]!.length};
  }
}

/**
 * Implement find/replace within a string such that content can be
 * replaced with JSX.
 */
export class JsxReplacer<ORIGINAL extends string | JSX.Element | (string | JSX.Element)[]> {
  private contentWithReplacements: (JSX.Element | string)[];
  constructor (public readonly originalContent: ORIGINAL) {
    this.contentWithReplacements = Array.isArray(originalContent) ? originalContent : [originalContent];
  }
  public readonly replace = (toReplace: string | RegExp, replacementElement: JSX.Element) => {
    this.contentWithReplacements = this.contentWithReplacements.reduce( (result, item ) => {
      if (typeof item !== "string") {
        // Can't replace within JSX or if item not found
        result.push(item);
        return result;
      }
      const match = findIndexAndLength(item, toReplace);
      if (match == null) {
        // string to replace not found in
        result.push(item);
        return result;
      } else {
        // string found and should be replaced
        const prefix = item.substr(0, match.index);
        const suffix = item.substr(match.index + match.length);
        result.push(prefix, replacementElement, suffix);
        return result;
      }
    }, [] as (JSX.Element | string)[])
  }
  public get replacement(): (JSX.Element | string)[] { return this.contentWithReplacements }
}
