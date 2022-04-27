/**
 * Run the function fn, returning it's return value or the default value if fn throws an exception.
 * @param fn A function to run and return the value of
 * @param defaultValue The value to return if fn throws an exception
 * @returns The result of calling fn, or defaultValue if fn() throws an exception
 */
export const defaultOnException = <R, DEFAULT = undefined>(
  fn: () => R | DEFAULT,
  defaultValue: DEFAULT = undefined as unknown as DEFAULT
): R | DEFAULT => {
  try { return fn(); } catch {} return defaultValue;
}