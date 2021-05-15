window.addEventListener('DOMContentLoaded', () => {

  const replaceText = (selector: string, text: string | undefined) => {
    const element = document.getElementById(selector)
    if (element && text) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})