export const defaultOnException = <R, DEFAULT = undefined>(
  fn: () => R | DEFAULT,
  defaultValue: DEFAULT = undefined as unknown as DEFAULT
): R | DEFAULT => {
  try { return fn(); } catch {} return defaultValue;
}