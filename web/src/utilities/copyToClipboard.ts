export const copyToClipboard = (value?: string): void => {
  if (value != null) {
    navigator.clipboard.writeText(value);
    // FUTURE - provide user notification that copy happened.
  }
}
