import React from 'react';
import { FileText } from 'lucide-react';
import { copy } from '../lib/copy.js';
import { formatBytes } from '../lib/fileUtils.js';

export function SummaryPanel({ sourceName, imageCount, ignoredCount, totalSize, outputName, onOutputNameChange, pdfUrl, pdfFileName }) {
  return (
    <aside className="glass-card summary-panel">
      <div>
        <h2 className="section-kicker">File Summary</h2>
        <div className="summary-list">
          <SummaryRow label={copy.summary.source} value={sourceName || copy.summary.emptySource} />
          <SummaryRow label={copy.summary.images} value={imageCount} />
          <SummaryRow label={copy.summary.size} value={formatBytes(totalSize)} />
          <SummaryRow label={copy.summary.ignored} value={ignoredCount} />
        </div>
      </div>

      <label className="control-field output-name-field">
        <span>{copy.output.fileName}</span>
        <input type="text" value={outputName} placeholder={copy.output.placeholder} onChange={(event) => onOutputNameChange(event.target.value)} />
      </label>

      {pdfUrl && (
        <div className="result-links">
          <a href={pdfUrl} target="_blank">
            <FileText size={17} />
            {copy.actions.preview(pdfFileName)}
          </a>
          <a href={pdfUrl} download={pdfFileName}>{copy.actions.download}</a>
        </div>
      )}

      <p className="privacy-note">Processing happens locally in your browser for privacy.</p>
    </aside>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
