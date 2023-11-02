
export const throwIfNull = <T>(value: T): NonNullable<T> => {
  if (value != null) {
    return value;
  }
  throw new Error(`Unexpected null or undefined value`);
};
