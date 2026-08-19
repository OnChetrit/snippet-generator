export interface SnippetLanguage {
  id: string;
  label: string;
  hint: string;
}

export interface FileDetails {
  filename: string;
  base: string;
  extension: string;
  language: SnippetLanguage;
}

export interface SnippetDetails {
  filename: string;
  folderName: string;
  snippetName: string;
  prefix: string;
  description: string;
  selectedText: string;
  isFileTemplate: boolean;
}

export interface SavedSnippet {
  id: string;
  details: SnippetDetails;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type TextSnippetDetailField = Exclude<
  keyof SnippetDetails,
  'isFileTemplate'
>;

export type UpdateSnippetDetails = <Field extends keyof SnippetDetails>(
  field: Field,
  value: SnippetDetails[Field],
) => void;

export type VariableValues = Record<string, string>;

export type PreviewPart =
  | { type: 'text'; value: string }
  | {
      type: 'variable' | 'placeholder' | 'cursor';
      label: string;
      value: string;
    };
