import Editor from '@monaco-editor/react';
import type { BeforeMount, OnMount } from '@monaco-editor/react';
import {
  CHOICE_INSERT,
  PLACEHOLDER_INSERT,
  SNIPPET_VARIABLES,
  TEXT_TRANSFORMS,
} from '../constants/snippet';
import { useRef, useState } from 'react';
import type { FileDetails, VariableValues } from '../types/snippet';

const VARIABLE_PREFIX = String.fromCharCode(36);
const VARIABLE_START = `${VARIABLE_PREFIX}{`;
const SELECTED_TEXT_VARIABLE = `${VARIABLE_PREFIX}{selectedText}`;
const DIRECTORY_VARIABLE = `${VARIABLE_PREFIX}{directory}`;
const FILENAME_BASE_VARIABLE = `${VARIABLE_PREFIX}{filenameBase}`;
const CAPITALIZED_DIRECTORY = `${VARIABLE_PREFIX}{directory.capitalize}`;

interface SnippetEditorPanelProps {
  body: string;
  file: FileDetails;
  onBeforeMount: BeforeMount;
  onChange: (value: string) => void;
  onInsert: (text: string) => void;
  onMount: OnMount;
  onReplaceSelection: () => void;
  values: VariableValues;
}

type SuggestionState =
  | { type: 'variables'; query: string }
  | {
      type: 'transforms';
      query: string;
      transforms: string[];
      variableName: string;
    }
  | null;

function SnippetEditorPanel({
  body,
  file,
  onBeforeMount,
  onChange,
  onInsert,
  onMount,
  onReplaceSelection,
  values,
}: SnippetEditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionState>(null);

  const updateSuggestions = (editor: Parameters<OnMount>[0]) => {
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;

    const beforeCursor = model
      .getLineContent(position.lineNumber)
      .slice(0, position.column - 1);
    const transformMatch = beforeCursor.match(
      /\$\{([a-zA-Z][\w]*)\.((?:[a-zA-Z][\w]*\.)*)([\w]*)$/,
    );
    if (transformMatch) {
      setSuggestion({
        type: 'transforms',
        variableName: transformMatch[1],
        transforms: transformMatch[2].split('.').filter(Boolean),
        query: transformMatch[3],
      });
      return;
    }

    const variableMatch = beforeCursor.match(/\$\{([\w]*)$/);
    setSuggestion(
      variableMatch ? { type: 'variables', query: variableMatch[1] } : null,
    );
  };

  const insertSuggestion = (name: string) => {
    const editor = editorRef.current;
    if (!editor || !suggestion) return;

    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;
    const hasClosingBrace =
      model.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column + 1,
      }) === '}';
    const text = hasClosingBrace ? name : `${name}}`;
    editor.executeEdits('snippet-smart-suggestion', [
      {
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - suggestion.query.length,
          endColumn: position.column,
        },
        text,
        forceMoveMarkers: true,
      },
    ]);
    if (suggestion.type === 'variables') {
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + text.length + (hasClosingBrace ? 1 : 0),
      });
    }
    setSuggestion(null);
    editor.focus();
  };

  const visibleVariables = SNIPPET_VARIABLES.filter(({ name }) =>
    name
      .toLowerCase()
      .startsWith(
        suggestion?.type === 'variables' ? suggestion.query.toLowerCase() : '',
      ),
  );
  const visibleTransforms = TEXT_TRANSFORMS.filter(({ name }) =>
    name
      .toLowerCase()
      .startsWith(
        suggestion?.type === 'transforms' ? suggestion.query.toLowerCase() : '',
      ),
  );
  const transformedVariable =
    suggestion?.type === 'transforms'
      ? SNIPPET_VARIABLES.find(({ name }) => name === suggestion.variableName)
      : undefined;
  const transformValue = transformedVariable
    ? values[transformedVariable.token] || '∅'
    : '';
  return (
    <section className="editor-panel">
      <div className="editor-toolbar">
        <div>
          <span aria-hidden="true" className="file-dot" />
          <strong>{file.filename}</strong>
          <span className="editor-language">{file.language.hint}</span>
        </div>
        <button
          className="selection-button"
          onClick={onReplaceSelection}
          type="button"
        >
          Use selection as <code>{SELECTED_TEXT_VARIABLE}</code>
        </button>
      </div>

      <Editor
        beforeMount={onBeforeMount}
        height="530px"
        language={file.language.id}
        onChange={(value) => onChange(value || '')}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          onMount(editor, monaco);

          editor.onDidChangeModelContent(() => updateSuggestions(editor));
          editor.onDidChangeCursorPosition(() => updateSuggestions(editor));
        }}
        options={{
          automaticLayout: true,
          fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, monospace',
          fontSize: 14,
          minimap: { enabled: false },
          padding: { top: 18 },
          scrollBeyondLastLine: false,
          suggest: {
            showWords: false,
            preview: true,
            showStatusBar: false,
          },
          quickSuggestions: true,
          renderValidationDecorations: 'off',
          suggestOnTriggerCharacters: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
        theme="snippet-studio"
        value={body}
      />

      {suggestion?.type === 'variables' && (
        <div aria-label="Variable suggestions" className="smart-suggestions">
          <div className="smart-suggestions-heading">
            <span>VARIABLES</span>
            <kbd>Click, then type . to chain</kbd>
          </div>
          <div className="smart-suggestions-list">
            {visibleVariables.map(({ name, token, hint }) => (
              <button
                key={name}
                onClick={() => insertSuggestion(name)}
                type="button"
              >
                <code>{`${VARIABLE_PREFIX}{${name}}`}</code>
                <span>{hint}</span>
                <strong>{values[token] || '∅'}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestion?.type === 'transforms' && transformedVariable && (
        <div
          aria-label="Transformation suggestions"
          className="smart-suggestions"
        >
          <div className="smart-suggestions-heading">
            <span>
              TRANSFORM {VARIABLE_PREFIX}
              {'{'}
              {transformedVariable.name}
              {'}'}
            </span>
            <kbd>Click to insert</kbd>
          </div>
          <div className="smart-suggestions-list">
            {visibleTransforms.map(({ name, hint }) => (
              <button
                key={name}
                onClick={() => insertSuggestion(name)}
                type="button"
              >
                <code>{`${VARIABLE_PREFIX}{${transformedVariable.name}.${name}}`}</code>
                <span>{hint}</span>
                <strong>
                  {transformPreview(
                    transformValue,
                    suggestion.transforms.concat(name),
                  )}
                </strong>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="editor-assist">
        <div className="editor-assist-copy">
          <span className="editor-assist-label">SMART VARIABLES</span>
          <p>
            Type <kbd>{VARIABLE_START}</kbd> for a variable, then add{' '}
            <kbd>.</kbd> for a transformation.
          </p>
        </div>
        <div aria-label="Editor shortcuts" className="editor-shortcuts">
          <button onClick={() => onInsert(DIRECTORY_VARIABLE)} type="button">
            {DIRECTORY_VARIABLE}
          </button>
          <button
            onClick={() => onInsert(FILENAME_BASE_VARIABLE)}
            type="button"
          >
            {FILENAME_BASE_VARIABLE}
          </button>
          <button onClick={() => onInsert(CAPITALIZED_DIRECTORY)} type="button">
            {CAPITALIZED_DIRECTORY}
          </button>
          <button onClick={() => onInsert(PLACEHOLDER_INSERT)} type="button">
            tabstop
          </button>
          <button onClick={() => onInsert(CHOICE_INSERT)} type="button">
            choice
          </button>
        </div>
      </div>
    </section>
  );
}

function transformPreview(value: string, transforms: string[]) {
  return transforms.reduce((currentValue, transform) => {
    if (transform === 'upperCase') return currentValue.toUpperCase();
    if (transform === 'lowerCase') return currentValue.toLowerCase();
    if (transform === 'capitalize') {
      return `${currentValue.charAt(0).toUpperCase()}${currentValue.slice(1)}`;
    }

    const words = currentValue.split(/[^a-zA-Z0-9]+/).filter(Boolean);
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
  }, value);
}

export default SnippetEditorPanel;
