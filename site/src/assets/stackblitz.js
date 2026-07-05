// NOTICE!!! Initially embedded in our docs this JavaScript
// file contains elements that can help you create reproducible
// use cases in StackBlitz for instance.
// In a real project please adapt this content to your needs.
// ++++++++++++++++++++++++++++++++++++++++++

/*!
 * JavaScript for Chassis's docs (https://chassis-ui.com/)
 * Copyright 2024-2025 The Chassis Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 * For details, see https://creativecommons.org/licenses/by/3.0/.
 */

import snippetsContent from './snippets.js?raw'

// These values will be replaced by Astro's Vite plugin
const CONFIG = {
  cssCdn: '__CSS_CDN__',
  jsBundleCdn: '__JS_BUNDLE_CDN__'
}

export default () => {
  document.querySelectorAll('.button-edit').forEach(button => {
    button.addEventListener('click', async event => {
      const codeSnippet = event.target.closest('.cxd-code-snippet')
      const exampleEl = codeSnippet.querySelector('.cxd-example')

      const htmlSnippet = exampleEl.innerHTML
      const jsSnippet = codeSnippet.querySelector('.button-edit').getAttribute('data-sb-js-snippet')
      const classes = Array.from(exampleEl.classList).join(' ')

      await openChassisSnippet(htmlSnippet, jsSnippet, classes)
    })
  })
}

const openChassisSnippet = async (htmlSnippet, jsSnippet, classes) => {
  const { default: sdk } = await import('@stackblitz/sdk')
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="${CONFIG.cssCdn}" rel="stylesheet">
    <title>Chassis Example</title>
    <script defer src="${CONFIG.jsBundleCdn}"></script>
  </head>
  <body class="p-medium m-0 border-0 ${classes}">
    <!-- Example Code Start-->
${htmlSnippet.trimStart().replace(/^/gm, '    ').replace(/^ {4}$/gm, '').trimEnd()}
    <!-- Example Code End -->
  </body>
</html>`

  // Modify snippets content to replace the export default with a variable and invoke it
  let modifiedSnippetsContent = ''

  if (jsSnippet) {
    modifiedSnippetsContent = snippetsContent.replace(
      'export default () => {',
      'const snippets_default = () => {'
    )

    modifiedSnippetsContent = `(() => {
  ${modifiedSnippetsContent}

  // <stdin>
  snippets_default();
})();`
  }

  const project = {
    files: {
      'index.html': indexHtml,
      ...(jsSnippet && { 'index.js': modifiedSnippetsContent })
    },
    title: 'Chassis Example',
    description: `Official example from ${window.location.href}`,
    template: jsSnippet ? 'javascript' : 'html',
    tags: ['chassis']
  }

  sdk.openProject(project, { openFile: 'index.html' })
}
