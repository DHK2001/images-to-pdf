import React from 'react';
import { Download, Eye, X } from 'lucide-react';
import { copy } from '../lib/copy.js';

export function SuccessModal({ isOpen, pdfUrl, pdfFileName, onClose }) {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pdf-ready-title">
        <div className="modal-header">
          <div>
            <h2 id="pdf-ready-title">{copy.result.title}</h2>
            <p>{copy.result.message(pdfFileName)}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={copy.actions.close}>
            <X size={18} />
          </button>
        </div>

        <div className="button-row">
          <a href={pdfUrl} target="_blank">
            <Eye size={18} />
            {copy.actions.preview(pdfFileName)}
          </a>
          <a href={pdfUrl} download={pdfFileName}>
            <Download size={18} />
            {copy.actions.download}
          </a>
        </div>
      </div>
    </div>
  );
}
