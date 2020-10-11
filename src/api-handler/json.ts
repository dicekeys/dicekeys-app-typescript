
const deepCanonicalizeObjectFieldOrder = <T>(item: T): T =>
  Array.isArray(item) ?
      // copy array, processing each item recursively
      item.reduce(
        (result, item) => {
          result.push( deepCanonicalizeObjectFieldOrder(item ) );
          return result;
        } ,new Array() as typeof item
      )
    :
  (typeof(item) === "object" && !(item instanceof Date)) ?
      // Copy the object entry by entry...
      Object.entries(item)
      // re-ordering keys in string sort order...
      .sort((a, b) => b[0].localeCompare(a[0]))
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
