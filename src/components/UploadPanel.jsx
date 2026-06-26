import React from 'react';
import { Archive, FileImage, FolderOpen, ImagePlus, Images } from 'lucide-react';
import { copy } from '../lib/copy.js';
import { formatBytes } from '../lib/fileUtils.js';

export function UploadPanel({
  imageInputRef,
  folderInputRef,
  archiveInputRef,
  sourceName,
  imageCount,
  ignoredCount,
  totalSize,
  onDrop,
  onImageChange,
  onFolderChange,
  onArchiveChange,
}) {
  return (
    <>
      <div className="brand-row">
        <div className="brand-mark">
          <Images size={24} />
        </div>
        <div>
          <h1>{copy.appTitle}</h1>
        </div>
      </div>

      <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <FileImage size={42} />
        <strong>{copy.uploadTitle}</strong>
        <span>{copy.uploadHint}</span>
        <div className="button-row">
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

      <input
        ref={imageInputRef}
        className="hidden-input"
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        onChange={onImageChange}
      />
      <input
        ref={folderInputRef}
        className="hidden-input"
        type="file"
        multiple
        webkitdirectory="true"
        directory="true"
        onChange={onFolderChange}
      />
      <input ref={archiveInputRef} className="hidden-input" type="file" accept=".zip,.rar,application/zip,application/vnd.rar,application/x-rar-compressed" onChange={onArchiveChange} />

      <div className="summary">
        <SummaryItem label={copy.summary.source} value={sourceName || copy.summary.emptySource} />
        <SummaryItem label={copy.summary.images} value={imageCount} />
        <SummaryItem label={copy.summary.size} value={formatBytes(totalSize)} />
        <SummaryItem label={copy.summary.ignored} value={ignoredCount} />
      </div>
    </>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
