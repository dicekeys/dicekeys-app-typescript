export const withDefined = <T, R>(value: T | undefined, callback: (value: T) => R): R | undefined => {
  if (typeof (value) != "undefined") {
    return callback(value);
  }
  return;
}

export const withNonNull = <T, R>(value: T | undefined, callback: (value: NonNullable<T>) => R): R | undefined => {
  if (value != null) {
    return callback(value as Exclude<T, null | undefined>);
  }
  return;
}
