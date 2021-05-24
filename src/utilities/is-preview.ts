export const isRunningInPreviewMode = () => {
  return window.location.hostname==="localhost" && window.location.search.startsWith("?name");
}