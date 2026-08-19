import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { OnMount } from '@monaco-editor/react';
import Header from './components/Header';
import Hero from './components/Hero';
import SnippetDetailsPanel from './components/SnippetDetailsPanel';
import SnippetEditorPanel from './components/SnippetEditorPanel';
import SnippetOutput from './components/SnippetOutput';
import SnippetPreviewPanel from './components/SnippetPreviewPanel';
import {
  configureMonaco,
  setSnippetCompletionContext,
} from './lib/configureMonaco';
import { loadSavedSnippets, saveSnippet } from './lib/savedSnippets';
import {
  createPreviewParts,
  getFileDetails,
  getVariableValues,
  makeSnippet,
} from './lib/snippet';
import type {
  SavedSnippet,
  SnippetDetails,
  UpdateSnippetDetails,
} from './types/snippet';
import './styles/app.scss';

const INITIAL_DETAILS: SnippetDetails = {
  filename: 'Button.jsx',
  folderName: 'components',
  snippetName: 'TSX component + module scss',
  prefix: 'tsxms',
  description: 'A reusable react typescript component with module scss.',
  selectedText: 'Text to insert with TM_SELECTED_TEXT',
  isFileTemplate: false,
};

const VARIABLE_PREFIX = String.fromCharCode(36);
const SELECTED_TEXT_VARIABLE = `${VARIABLE_PREFIX}{selectedText}`;
const INITIAL_EDITOR_WIDTH = 41;
const MIN_EDITOR_WIDTH = 35;
const MAX_EDITOR_WIDTH = 70;
const RESIZE_STEP = 2;

interface ResizeState {
  editorWidth: number;
  pointerId: number;
  startX: number;
}

const INITIAL_BODY = `import styles from './\${filenameBase}.module.scss';

type \${filenameBase}Props {}

const \${filenameBase}: \${filenameBase}Props = () => {

  return (
    <div className={styles.root}>
      \${selectedText}
    </div>
  );
};

export default \${filenameBase};`;

function App() {
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [body, setBody] = useState(INITIAL_BODY);
  const [copied, setCopied] = useState(false);
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('Not saved yet');
  const [editorWidth, setEditorWidth] = useState(INITIAL_EDITOR_WIDTH);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const editorWidthRef = useRef(INITIAL_EDITOR_WIDTH);
  const resizeRef = useRef<ResizeState | null>(null);
  const workspaceContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedSnippets = loadSavedSnippets();
    setSavedSnippets(storedSnippets);
    if (storedSnippets.length)
      setSaveMessage(`${storedSnippets.length} saved locally`);
  }, []);

  const file = useMemo(
    () => getFileDetails(details.filename),
    [details.filename],
  );
  const values = useMemo(
    () => getVariableValues(file, details.selectedText, details.folderName),
    [details.folderName, details.selectedText, file],
  );
  const preview = useMemo(
    () => createPreviewParts(body, values),
    [body, values],
  );
  const snippetJson = useMemo(
    () =>
      makeSnippet(
        details.snippetName,
        details.prefix,
        details.description,
        body,
        details.isFileTemplate,
      ),
    [
      body,
      details.description,
      details.isFileTemplate,
      details.prefix,
      details.snippetName,
    ],
  );

  useEffect(() => {
    setSnippetCompletionContext(values);
  }, [values]);

  const updateDetails: UpdateSnippetDetails = (field, value) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const insertText = (text: string) => {
    const editor = editorRef.current;
    if (!editor) {
      setBody((current) => `${current}${text}`);
      return;
    }

    editor.executeEdits('snippet-variable', [
      { range: editor.getSelection(), text, forceMoveMarkers: true },
    ]);
    editor.focus();
  };

  const captureSelectionAsVariable = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selected = editor.getModel().getValueInRange(editor.getSelection());
    if (selected) updateDetails('selectedText', selected);
    insertText(SELECTED_TEXT_VARIABLE);
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippetJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadSnippet = () => {
    const blob = new Blob([snippetJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${file.base || 'snippet'}.code-snippets`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const saveCurrentSnippet = () => {
    try {
      const saved = saveSnippet(savedSnippets, details, body, activeSnippetId);
      setSavedSnippets(saved.snippets);
      setActiveSnippetId(saved.snippet.id);
      setSaveMessage('Saved locally');
    } catch {
      setSaveMessage('Could not save locally');
    }
  };

  const createNewSnippet = () => {
    setDetails(INITIAL_DETAILS);
    setBody(INITIAL_BODY);
    setActiveSnippetId(null);
    setSaveMessage('New snippet');
    editorRef.current?.setValue(INITIAL_BODY);
  };

  const openSavedSnippet = (id: string) => {
    const savedSnippet = savedSnippets.find((snippet) => snippet.id === id);
    if (!savedSnippet) return;

    setDetails(savedSnippet.details);
    setBody(savedSnippet.body);
    setActiveSnippetId(savedSnippet.id);
    setSaveMessage('Saved locally');
    editorRef.current?.setValue(savedSnippet.body);
  };

  const applyEditorWidth = (nextWidth: number) => {
    const boundedWidth = Math.min(
      MAX_EDITOR_WIDTH,
      Math.max(MIN_EDITOR_WIDTH, nextWidth),
    );
    editorWidthRef.current = boundedWidth;
    workspaceContentRef.current?.style.setProperty(
      '--editor-width',
      `${boundedWidth}%`,
    );
    return boundedWidth;
  };

  const finishResize = (target: HTMLDivElement, pointerId: number) => {
    if (resizeRef.current?.pointerId !== pointerId) return;

    resizeRef.current = null;
    if (target.hasPointerCapture(pointerId))
      target.releasePointerCapture(pointerId);
    setEditorWidth(editorWidthRef.current);
  };

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    const workspace = workspaceContentRef.current;
    if (!workspace) return;

    event.preventDefault();
    resizeRef.current = {
      editorWidth: editorWidthRef.current,
      pointerId: event.pointerId,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizePanels = (event: PointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    const workspace = workspaceContentRef.current;
    if (!resize || resize.pointerId !== event.pointerId || !workspace) return;

    const usableWidth = workspace.clientWidth - event.currentTarget.offsetWidth;
    if (usableWidth <= 0) return;

    applyEditorWidth(
      resize.editorWidth +
        ((event.clientX - resize.startX) / usableWidth) * 100,
    );
  };

  const resizeWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    setEditorWidth(
      applyEditorWidth(editorWidthRef.current + direction * RESIZE_STEP),
    );
  };

  const workspaceStyle = {
    '--editor-width': `${editorWidth}%`,
  } as CSSProperties;

  return (
    <main className="studio-shell">
      <Header
        activeSnippetId={activeSnippetId}
        copied={copied}
        onCopy={copySnippet}
        onDownload={downloadSnippet}
        onNew={createNewSnippet}
        onSave={saveCurrentSnippet}
        onSelectSavedSnippet={openSavedSnippet}
        savedSnippets={savedSnippets}
        saveMessage={saveMessage}
      />
      <Hero />
      <section aria-label="Snippet editor workspace" className="workspace">
        <div
          className="workspace-content"
          ref={workspaceContentRef}
          style={workspaceStyle}
        >
          <SnippetDetailsPanel
            details={details}
            file={file}
            onChange={updateDetails}
          />
          <SnippetEditorPanel
            body={body}
            file={file}
            onBeforeMount={configureMonaco}
            onChange={setBody}
            onInsert={insertText}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            onReplaceSelection={captureSelectionAsVariable}
            values={values}
          />
          <div
            aria-label="Resize editor and preview panels"
            aria-orientation="vertical"
            aria-valuemax={MAX_EDITOR_WIDTH}
            aria-valuemin={MIN_EDITOR_WIDTH}
            aria-valuenow={Math.round(editorWidth)}
            className="workspace-resizer"
            onKeyDown={resizeWithKeyboard}
            onLostPointerCapture={(event) =>
              finishResize(event.currentTarget, event.pointerId)
            }
            onPointerDown={startResize}
            onPointerMove={resizePanels}
            onPointerUp={(event) =>
              finishResize(event.currentTarget, event.pointerId)
            }
            role="separator"
            tabIndex={0}
          />
          <SnippetPreviewPanel file={file} preview={preview} />
        </div>
      </section>
      <SnippetOutput snippetJson={snippetJson} />
    </main>
  );
}

export default App;
