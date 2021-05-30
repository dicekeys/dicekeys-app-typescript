export const withDefined = <T, R>(value: T | undefined, callback: (value: T) => R) => {
  if (typeof (value) != "undefined") {
    callback(value);
  }
}

export const withNonNull = <T, R>(value: T | undefined, callback: (value: NonNullable<T>) => R) => {
  if (value != null) {
    callback(value as Exclude<T, null | undefined>);
  }
}
