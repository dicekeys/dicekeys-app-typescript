/**
 * Filter all nulls and undefined from an array with typings so that TypeScript
 * will know that the result array contains only non-null values.
 * @param array An array of items that may include null or undefined values
 * @returns A order-preserved copy of the input array with all null/undefined values removed.
 */
export const typedFilterNulls = <T>(array: (T | null | undefined)[]): T[] =>
  array.filter( item => item != null ) as T[]

/**
 * Given a function that tests if a value is of type T, create an array filter function.
 * That array filter function takes an unknown value.  If the unknown value is an array,
 * it returns an order-preserved copy of the array with only the values that pass the filter
 * (those that are of type T). If the value is not an array, it returns an empty array.
 * @param filter A function that tests if an unknown value is of type T.
 * @returns An function that filters array to keep only those elements that are of type T.
 */
export const typedArrayFilter = <T>( filter: (candidate: unknown) => candidate is T ) =>
  (arrayOfCandidates: unknown): T[] => Array.isArray(arrayOfCandidates) ?
    arrayOfCandidates.filter( filter ) as T[] :
    [];

export type StrictTypeEquals<A1, A2> = (<A>() => A extends A2 ? true : false) extends <A>() => A extends A1
    ? true
    : false
    ? true
    : false;
export type Unite<T> = T extends Record<string, unknown> ? { [Key in keyof T]: T[Key] } : T;
export type TypeEquals<A1, A2> = StrictTypeEquals<Unite<A1>, Unite<A2>>;
export const typeAssert = <T extends true>(_condition?: T): asserts _condition => {};
