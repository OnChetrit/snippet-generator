# Snippet Studio

A visual VS Code snippet generator built with React, TypeScript, and Sass. Choose
a filename to enable the appropriate Monaco language mode, use Emmet in
HTML/CSS/JSX/TSX files, add native snippet variables and tabstops, and inspect an
expanded preview before copying the JSON.

## Run locally

```bash
npm install
npm start
```

## Quality checks

```bash
npm run format
npm run format:check
npm run typecheck
npm test -- --watchAll=false
npm run build
```

## Use the generated snippet

Copy the generated definition into VS Code's **Snippets: Configure Snippets**
file for the target language, or download it as a project `.code-snippets` file.

`$TM_SELECTED_TEXT` is resolved from the Variable context field in the preview.
In the editor, select existing code and click **Replace selection with
$TM_SELECTED_TEXT** to preserve it at the insertion point.

The generator supports VS Code tabstops (`$1`, `$0`), placeholders
(`${1:name}`), choices (`${1|one,two|}`), and built-in variables.
