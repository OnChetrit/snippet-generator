import type { SavedSnippet } from '../types/snippet';

interface HeaderProps {
  copied: boolean;
  activeSnippetId: string | null;
  saveMessage: string;
  savedSnippets: SavedSnippet[];
  onCopy: () => void;
  onDownload: () => void;
  onNew: () => void;
  onSave: () => void;
  onSelectSavedSnippet: (id: string) => void;
}

function Header({
  copied,
  activeSnippetId,
  saveMessage,
  savedSnippets,
  onCopy,
  onDownload,
  onNew,
  onSave,
  onSelectSavedSnippet,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <span aria-hidden="true" className="brand-mark">
          ⌘
        </span>
        <span>Snippet Studio</span>
      </div>
      <div className="topbar-actions">
        <span aria-live="polite" className="saved-dot">
          ● {saveMessage}
        </span>
        <label className="saved-snippets-picker">
          <span className="sr-only">Open a saved snippet</span>
          <select
            aria-label="Open a saved snippet"
            onChange={(event) => {
              if (event.target.value) onSelectSavedSnippet(event.target.value);
            }}
            value={activeSnippetId || ''}
          >
            <option value="">Saved snippets ({savedSnippets.length})</option>
            {savedSnippets.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.details.snippetName || 'Untitled snippet'}
              </option>
            ))}
          </select>
        </label>
        <button className="quiet-button" onClick={onNew} type="button">
          New snippet
        </button>
        <button
          className="quiet-button download-button"
          onClick={onDownload}
          type="button"
        >
          Download .code-snippets
        </button>
        <button className="save-button" onClick={onSave} type="button">
          {activeSnippetId ? 'Save changes' : 'Save locally'}
        </button>
        <button className="primary-button" onClick={onCopy} type="button">
          {copied ? 'Copied!' : 'Copy snippet JSON'}
        </button>
      </div>
    </header>
  );
}

export default Header;
