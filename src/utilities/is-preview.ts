export const isRunningInPreviewMode = () => {
  return window.location.pathname.startsWith("preview")
}