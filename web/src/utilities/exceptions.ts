/***
 * Rather than use `any` or `unknown` when catching an exception, this 
 * alias tells the reader that this values is unknown because it contains
 * values caught by an exception.
 */
export type UnknownValueCaughtByCatch = unknown;
export type Caught = UnknownValueCaughtByCatch;

export const caughtValueIsString = (u: UnknownValueCaughtByCatch): u is string =>
  typeof u === "string";

export const caughtValueIsObject = (u: UnknownValueCaughtByCatch): u is object =>
  typeof u === "object" && u != null;

export const caughtValueIsInstanceOfError = (u: UnknownValueCaughtByCatch): u is Error =>
  typeof u === "object" && u != null && u instanceof Error;

