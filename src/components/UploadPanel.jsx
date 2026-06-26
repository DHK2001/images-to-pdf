import React from 'react';
import { Archive, FileImage, FolderOpen, ImagePlus } from 'lucide-react';
import { copy } from '../lib/copy.js';

export function UploadPanel({ imageInputRef, folderInputRef, archiveInputRef, onDrop, onImageChange, onFolderChange, onArchiveChange }) {
  return (
    <section className="upload-section animate-in">
      <div className="glass-card upload-card">
        <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
          <FileImage className="upload-icon" size={58} />
          <h2>{copy.uploadTitle}</h2>
          <p>{copy.uploadHint}</p>
          <div className="button-row upload-actions">
            <button type="button" onClick={() => imageInputRef.current?.click()}>
              <ImagePlus size={18} />
              {copy.imagesButton}
            </button>
            <button type="button" onClick={() => folderInputRef.current?.click()}>
              <FolderOpen size={18} />
              {copy.folderButton}
            </button>
            <button type="button" onClick={() => archiveInputRef.current?.click()}>
              <Archive size={18} />
              {copy.archiveButton}
            </button>
          </div>
        </div>
      </div>

      <input ref={imageInputRef} className="hidden-input" type="file" multiple accept="image/*,.heic,.heif" onChange={onImageChange} />
      <input ref={folderInputRef} className="hidden-input" type="file" multiple webkitdirectory="true" directory="true" onChange={onFolderChange} />
      <input ref={archiveInputRef} className="hidden-input" type="file" accept=".zip,.rar,application/zip,application/vnd.rar,application/x-rar-compressed" onChange={onArchiveChange} />
    </section>
  );
}
