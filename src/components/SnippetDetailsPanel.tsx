import type { ChangeEvent } from 'react';
import type {
  FileDetails,
  SnippetDetails,
  TextSnippetDetailField,
  UpdateSnippetDetails,
} from '../types/snippet';

interface SnippetDetailsPanelProps {
  details: SnippetDetails;
  file: FileDetails;
  onChange: UpdateSnippetDetails;
}

function SnippetDetailsPanel({
  details,
  file,
  onChange,
}: SnippetDetailsPanelProps) {
  const updateField =
    (field: TextSnippetDetailField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, event.target.value);

  return (
    <aside className="settings-panel">
      <div className="panel-title-row">
        <h2>Snippet details</h2>
        <span className="language-pill">{file.language.label}</span>
      </div>

      <div className="details-fields">
        <div className="details-field">
          <label htmlFor="filename">
            File name
            <input
              id="filename"
              onChange={updateField('filename')}
              placeholder="Component.tsx"
              value={details.filename}
            />
          </label>
          <p className="field-help">Extension selects {file.language.hint}.</p>
        </div>

        <div className="details-field">
          <label htmlFor="folder-name">
            Folder name
            <input
              id="folder-name"
              onChange={updateField('folderName')}
              placeholder="components"
              value={details.folderName}
            />
          </label>
          <p className="field-help">
            Used to resolve <code>$TM_DIRECTORY</code> in the preview.
          </p>
        </div>

        <div className="details-field">
          <label htmlFor="snippet-name">
            Snippet name
            <input
              id="snippet-name"
              onChange={updateField('snippetName')}
              placeholder="My snippet"
              value={details.snippetName}
            />
          </label>
        </div>

        <div className="details-field">
          <label htmlFor="prefix">
            Prefix
            <input
              id="prefix"
              onChange={updateField('prefix')}
              placeholder="trigger"
              value={details.prefix}
            />
          </label>
        </div>

        <div className="details-field">
          <label htmlFor="description">
            Description
            <input
              id="description"
              onChange={updateField('description')}
              placeholder="Shown in IntelliSense"
              value={details.description}
            />
          </label>
        </div>

        <div className="template-field">
          <label className="details-field-label" htmlFor="file-template">
            File template
          </label>
          <label className="template-toggle">
            <input
              checked={details.isFileTemplate}
              id="file-template"
              onChange={(event) =>
                onChange('isFileTemplate', event.target.checked)
              }
              type="checkbox"
            />
            <span aria-hidden="true" className="template-checkbox" />
            <span>Use with “Fill File with Snippet”</span>
          </label>
        </div>

        <div className="variables-heading">
          <h2>Variable context</h2>
          <span>Resolved in preview</span>
        </div>

        <div className="details-field selected-text-field">
          <label htmlFor="selected-text">
            Selected text
            <textarea
              id="selected-text"
              onChange={updateField('selectedText')}
              placeholder="Text to insert with TM_SELECTED_TEXT"
              rows={2}
              value={details.selectedText}
            />
          </label>
          <p className="field-help">
            Select code, then use the replace action to preserve it as{' '}
            <code>$TM_SELECTED_TEXT</code>.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default SnippetDetailsPanel;
