interface SnippetOutputProps {
  snippetJson: string;
}

function SnippetOutput({ snippetJson }: SnippetOutputProps) {
  return (
    <section className="output-section">
      <div>
        <p className="eyebrow">READY FOR VS CODE</p>
        <h2>Generated snippet definition</h2>
        <p>
          Paste this into a language snippet file, or save it as a project{' '}
          <code>.code-snippets</code> file.
        </p>
      </div>
      <pre className="json-output">{snippetJson}</pre>
    </section>
  );
}

export default SnippetOutput;
