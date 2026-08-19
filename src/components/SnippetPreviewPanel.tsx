import type { FileDetails, PreviewPart } from '../types/snippet';

interface SnippetPreviewPanelProps {
  file: FileDetails;
  preview: PreviewPart[];
}

function SnippetPreviewPanel({ file, preview }: SnippetPreviewPanelProps) {
  return (
    <section className="preview-panel">
      <div className="preview-heading">
        <div>
          <p className="eyebrow">LIVE RESULT</p>
          <h2>Placement preview</h2>
        </div>
        <span className="preview-file">{file.filename}</span>
      </div>

      <p className="preview-help">
        <i aria-hidden="true" className="variable-swatch" /> variables
        <i aria-hidden="true" className="placeholder-swatch" /> editable
        tabstops
      </p>

      <pre aria-label="Expanded snippet preview" className="file-preview">
        {preview.map((part, index) => {
          if (part.type === 'text') return part.value;

          return (
            <span
              className={`preview-token ${part.type}`}
              key={`${part.label}-${index}`}
              title={part.label}
            >
              {part.value}
            </span>
          );
        })}
      </pre>

      <div className="preview-footer">
        <span>Preview uses this file’s context</span>
        <strong>Tab through highlighted values in VS Code →</strong>
      </div>
    </section>
  );
}

export default SnippetPreviewPanel;
