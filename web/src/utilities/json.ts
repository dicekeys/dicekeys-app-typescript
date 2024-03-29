
const deepCanonicalizeObjectFieldOrder = <T>(item: T): T =>
  item instanceof ArrayBuffer || item instanceof Uint8Array || item instanceof Uint8ClampedArray || item instanceof Uint32Array || (typeof BigUint64Array != "undefined" && item instanceof BigUint64Array) ?
    item :
  Array.isArray(item) ?
      // copy array, processing each item recursively
      item.reduce(
        (result, item) => {
          result.push( deepCanonicalizeObjectFieldOrder(item ) );
          return result;
        }, [] as typeof item
      )
    :
  (typeof(item) === "object" && item != null && !(item instanceof Date)) ?
      // Copy the object entry by entry...
      Object.entries(item)
      // re-ordering keys in string sort order...
      .sort((a, b) => a[0].localeCompare(b[0]))
      // and processing values recursively
      .reduce( ( result, [key, value]) => {
          result[key as keyof T] = deepCanonicalizeObjectFieldOrder(value);
          return result;
        },
        {} as T
      )
    :
      // replicate non-objects (and dates) by reference (not deep copies)
      item;

export const jsonStringifyWithSortedFieldOrder = <T>(item: T, delimiter?: string ): string =>
  JSON.stringify( deepCanonicalizeObjectFieldOrder(item), undefined, delimiter );

export const isValidJson = (candidateJson: string | undefined): candidateJson is string => {
  if (candidateJson == null) return false;
  try {
    JSON.parse(candidateJson);
    return true;
  } catch {
    return false;
  }  
}