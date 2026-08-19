import { emmetCSS, emmetHTML, emmetJSX } from 'emmet-monaco-es';
import type { Monaco } from '@monaco-editor/react';
import { SNIPPET_VARIABLES, TEXT_TRANSFORMS } from '../constants/snippet';

let isConfigured = false;
let previewValues: Record<string, string> = {};

export function setSnippetCompletionContext(values: Record<string, string>) {
  previewValues = values;
}

export function configureMonaco(monaco: Monaco): void {
  if (isConfigured) return;

  isConfigured = true;
  monaco.editor.defineTheme('snippet-studio', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#101827',
      'editorGutter.background': '#101827',
      'editor.lineHighlightBackground': '#162235',
      'editorCursor.foreground': '#8bc7ff',
      'editorSuggestWidget.background': '#101c2f',
      'editorSuggestWidget.border': '#2a4563',
      'editorSuggestWidget.foreground': '#cfdded',
      'editorSuggestWidget.highlightForeground': '#81c7ff',
      'editorSuggestWidget.selectedBackground': '#193553',
      'editorHoverWidget.background': '#101c2f',
      'editorHoverWidget.border': '#2a4563',
    },
  });

  monaco.languages.registerCompletionItemProvider('*', {
    triggerCharacters: ['$', '{', '.'],
    provideCompletionItems(model, position) {
      const beforeCursor = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);
      const transformMatch = beforeCursor.match(
        /\$\{([a-zA-Z][\w]*)\.([\w]*)$/,
      );

      if (transformMatch) {
        const variable = SNIPPET_VARIABLES.find(
          ({ name }) => name === transformMatch[1],
        );
        if (!variable) return { suggestions: [] };

        const startColumn = position.column - transformMatch[2].length;
        const value = previewValues[variable.token] || '∅';
        return {
          suggestions: TEXT_TRANSFORMS.map(({ name, hint }) => ({
            kind: monaco.languages.CompletionItemKind.Property,
            label: name,
            detail: hint,
            documentation: {
              value: `**\${${variable.name}.${name}}**  \nPreview: \`${formatPreview(value, name)}\``,
            },
            insertText: `${name}}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn,
              endColumn: position.column,
            },
          })),
        };
      }

      const variableMatch = beforeCursor.match(/\$\{([\w]*)$/);
      if (!variableMatch) return { suggestions: [] };

      const startColumn = position.column - variableMatch[1].length;
      return {
        suggestions: SNIPPET_VARIABLES.map(({ name, token, hint }) => ({
          kind: monaco.languages.CompletionItemKind.Variable,
          label: name,
          detail: hint,
          documentation: {
            value: `**\${${name}}**  \nPreview: \`${previewValues[token] || '∅'}\``,
          },
          insertText: `${name}}`,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn,
            endColumn: position.column,
          },
        })),
      };
    },
  });

  emmetHTML(monaco, ['html', 'xml']);
  emmetCSS(monaco, ['css', 'scss', 'less']);
  emmetJSX(monaco, ['javascript', 'typescript']);
}

function formatPreview(value: string, transform: string) {
  if (transform === 'upperCase') return value.toUpperCase();
  if (transform === 'lowerCase') return value.toLowerCase();
  if (transform === 'capitalize') {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  const words = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const camelCase = words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join('');

  return transform === 'pascalCase'
    ? `${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`
    : camelCase;
}
