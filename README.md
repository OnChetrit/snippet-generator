# Snippet Studio

Snippet Studio is a visual VS Code snippet generator built with React,
TypeScript, Monaco Editor, and Sass. Create language-aware snippets, preview
their expansion, and copy or download the resulting JSON.

## Live site

[Open Snippet Studio](https://onchetrit.github.io/snippet-generator)

## Features

- Select a target filename to enable the matching Monaco language mode.
- Use Emmet in HTML, CSS, JSX, and TSX snippets.
- Add VS Code variables, tabstops, placeholders, and choices.
- Preview the expanded snippet with a custom variable context.
- Copy the JSON definition or download a project `.code-snippets` file.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm start` — start the local development server.
- `npm run build` — create a production build.
- `npm run deploy` — build and publish the app to GitHub Pages.
- `npm run typecheck` — run TypeScript checks.
- `npm test -- --watchAll=false` — run the test suite once.

## Quality checks

```bash
npm run format
npm run format:check
npm run typecheck
npm test -- --watchAll=false
npm run build
```

## Using generated snippets

Copy the generated definition into VS Code's **Snippets: Configure Snippets**
file for the target language, or download it as a project `.code-snippets` file.

`$TM_SELECTED_TEXT` is resolved from the Variable context field in the preview.
In the editor, select existing code and click **Replace selection with
$TM_SELECTED_TEXT** to preserve it at the insertion point.

The generator supports VS Code tabstops (`$1`, `$0`), placeholders
(`${1:name}`), choices (`${1|one,two|}`), and built-in variables.
