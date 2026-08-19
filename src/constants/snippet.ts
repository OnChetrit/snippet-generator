import type { SnippetLanguage } from '../types/snippet';

export const LANGUAGE_BY_EXTENSION: Record<string, SnippetLanguage> = {
  html: { id: 'html', label: 'HTML', hint: 'HTML + Emmet' },
  htm: { id: 'html', label: 'HTML', hint: 'HTML + Emmet' },
  css: { id: 'css', label: 'CSS', hint: 'CSS + Emmet' },
  scss: { id: 'scss', label: 'SCSS', hint: 'SCSS + Emmet' },
  js: { id: 'javascript', label: 'JavaScript', hint: 'JavaScript + Emmet' },
  jsx: { id: 'javascript', label: 'JavaScript React', hint: 'JSX + Emmet' },
  ts: { id: 'typescript', label: 'TypeScript', hint: 'TypeScript + Emmet' },
  tsx: { id: 'typescript', label: 'TypeScript React', hint: 'TSX + Emmet' },
  json: { id: 'json', label: 'JSON', hint: 'JSON IntelliSense' },
  md: { id: 'markdown', label: 'Markdown', hint: 'Markdown' },
  py: { id: 'python', label: 'Python', hint: 'Python' },
  yaml: { id: 'yaml', label: 'YAML', hint: 'YAML' },
  yml: { id: 'yaml', label: 'YAML', hint: 'YAML' },
  sql: { id: 'sql', label: 'SQL', hint: 'SQL' },
};

export const SNIPPET_VARIABLES = [
  {
    name: 'selectedText',
    token: 'TM_SELECTED_TEXT',
    hint: 'The selected editor text',
  },
  { name: 'filename', token: 'TM_FILENAME', hint: 'The file name' },
  {
    name: 'filenameBase',
    token: 'TM_FILENAME_BASE',
    hint: 'The file name without its extension',
  },
  { name: 'directory', token: 'TM_DIRECTORY', hint: 'The folder name' },
  { name: 'filePath', token: 'TM_FILEPATH', hint: 'The full file path' },
  { name: 'currentLine', token: 'TM_CURRENT_LINE', hint: 'The current line' },
  { name: 'year', token: 'CURRENT_YEAR', hint: 'The current year' },
  { name: 'date', token: 'CURRENT_DATE', hint: 'Today’s day of the month' },
  { name: 'uuid', token: 'UUID', hint: 'A generated UUID' },
  { name: 'clipboard', token: 'CLIPBOARD', hint: 'Clipboard contents' },
] as const;

export const VARIABLE_BY_FRIENDLY_NAME = Object.fromEntries(
  SNIPPET_VARIABLES.map((variable) => [variable.name, variable]),
) as Record<string, (typeof SNIPPET_VARIABLES)[number]>;

export const PLACEHOLDER_INSERT = ['$', '{1:placeholder}'].join('');
export const CHOICE_INSERT = ['$', '{1|one,two|}'].join('');

export const createVariableTransform = (name: string, format: string) =>
  ['$', '{', name, '/(.*)/', '$', '{1:/', format, '}', '/', '}'].join('');

export const TEXT_TRANSFORMS = [
  {
    name: 'upperCase',
    format: 'upcase',
    hint: 'Convert every letter to uppercase',
  },
  {
    name: 'lowerCase',
    format: 'downcase',
    hint: 'Convert every letter to lowercase',
  },
  {
    name: 'capitalize',
    format: 'capitalize',
    hint: 'Capitalize the first letter',
  },
  {
    name: 'camelCase',
    format: 'camelcase',
    hint: 'Convert words to camel case',
  },
  {
    name: 'pascalCase',
    format: 'pascalcase',
    hint: 'Convert words to Pascal case',
  },
] as const;
