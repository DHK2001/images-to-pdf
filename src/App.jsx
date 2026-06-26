import React, { useMemo, useRef, useState } from 'react';
import { Download, Eye, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { BusyOverlay } from './components/BusyOverlay.jsx';
import { CompositionPanel } from './components/CompositionPanel.jsx';
import { PageListPreview, SelectedPagePanel } from './components/PreviewPanels.jsx';
import { SuccessModal } from './components/SuccessModal.jsx';
import { UploadPanel } from './components/UploadPanel.jsx';
import { DEFAULT_OPTIONS, SUPPORTED_LABEL } from './lib/constants.js';
import { copy } from './lib/copy.js';
import {
  cleanPdfName,
  filesFromArchive,
  isSupportedArchive,
  folderNameFromItems,
  revokeImageItems,
  splitImageItems,
} from './lib/fileUtils.js';
import { groupPdfPages, pageDimensions } from './lib/layout.js';
import { buildPdf } from './lib/pdf.js';

export function App() {
  const imageInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const archiveInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [sourceName, setSourceName] = useState('');
  const [outputName, setOutputName] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imagesPerPage, setImagesPerPage] = useState(DEFAULT_OPTIONS.imagesPerPage);
  const [dragPageIndex, setDragPageIndex] = useState(null);
  const [layoutMode, setLayoutMode] = useState(DEFAULT_OPTIONS.layoutMode);
  const [pagePreset, setPagePreset] = useState(DEFAULT_OPTIONS.pagePreset);
  const [orientation, setOrientation] = useState(DEFAULT_OPTIONS.orientation);
  const [margin, setMargin] = useState(DEFAULT_OPTIONS.margin);
  const [gap, setGap] = useState(DEFAULT_OPTIONS.gap);
  const [gridColumns, setGridColumns] = useState(DEFAULT_OPTIONS.gridColumns);
  const [gridRows, setGridRows] = useState(DEFAULT_OPTIONS.gridRows);
  const [optimizeImages, setOptimizeImages] = useState(DEFAULT_OPTIONS.optimizeImages);
  const [imageQuality, setImageQuality] = useState(DEFAULT_OPTIONS.imageQuality);
  const [maxImageDimension, setMaxImageDimension] = useState(DEFAULT_OPTIONS.maxImageDimension);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const totalSize = useMemo(() => images.reduce((sum, item) => sum + item.file.size, 0), [images]);
  const pagePlan = useMemo(() => groupPdfPages(images, imagesPerPage), [images, imagesPerPage]);
  const activePageIndex = pagePlan.length ? Math.min(selectedPageIndex, pagePlan.length - 1) : 0;
  const activePageItems = pagePlan[activePageIndex] || [];
  const previewPaper = pageDimensions(pagePreset, orientation);
  const pageMargin = layoutMode === 'paper' ? margin : 0;
  const pageGap = layoutMode === 'paper' ? gap : 0;
  const imageGrid = { cols: gridColumns, rows: gridRows };

  function revokePdf() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
    setPdfFileName('');
    setShowSuccessModal(false);
  }

  function applyImages(nextImages, nextIgnored, nextSourceName, nextStatus) {
    revokePdf();
    revokeImageItems(images);
    setError('');
    setImages(nextImages);
    setIgnoredCount(nextIgnored);
    const resolvedSourceName = nextSourceName || folderNameFromItems(nextImages);
    setSourceName(resolvedSourceName);
    setOutputName(resolvedSourceName || copy.output.placeholder);
    setSelectedPageIndex(0);

    if (!nextImages.length) {
      setStatus('');
      setError(copy.errors.noImages(SUPPORTED_LABEL));
      return;
    }

    const ignoredText = nextIgnored ? copy.status.ignoredFiles(nextIgnored) : '';
    setStatus(nextStatus || copy.status.loaded(nextImages.length, ignoredText));
  }

  async function handleImageChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;

    setIsBusy(true);
    setError('');
    setStatus(copy.status.readingImages);
    try {
      const result = await splitImageItems(files);
      applyImages(result.images, result.ignored, copy.output.placeholder);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFolderChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;

    setIsBusy(true);
    setError('');
    setStatus(copy.status.readingFolder);
    try {
      const result = await splitImageItems(files);
      applyImages(result.images, result.ignored, '');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleArchiveChange(event) {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;

    setIsBusy(true);
    setError('');
    setStatus(copy.status.readingArchive);
    try {
      const result = await filesFromArchive(file);
      const ignoredText = result.ignored ? copy.status.ignoredFiles(result.ignored) : '';
      applyImages(result.images, result.ignored, result.sourceName, copy.status.loadedArchive(result.images.length, ignoredText));
    } catch (archiveError) {
      setError(archiveError.message || copy.errors.archiveRead);
      setStatus('');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const archive = files.find((file) => isSupportedArchive(file.name));
    if (archive) {
      setIsBusy(true);
      setError('');
      setStatus(copy.status.readingArchive);
      try {
        const result = await filesFromArchive(archive);
        const ignoredText = result.ignored ? copy.status.ignoredFiles(result.ignored) : '';
        applyImages(result.images, result.ignored, result.sourceName, copy.status.loadedArchive(result.images.length, ignoredText));
      } catch (archiveError) {
        setError(archiveError.message || copy.errors.archiveRead);
        setStatus('');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    if (!files.length) return;

    setIsBusy(true);
    setError('');
    setStatus(copy.status.readingImages);
    try {
      const result = await splitImageItems(files);
      applyImages(result.images, result.ignored, copy.output.placeholder);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGeneratePdf() {
    if (!images.length) {
      setError(copy.errors.noSelection);
      return;
    }

    setIsBusy(true);
    setError('');
    revokePdf();

    try {
      const bytes = await buildPdf(images, setStatus, {
        imagesPerPage,
        layoutMode,
        pagePreset,
        orientation,
        margin: pageMargin,
        gap: pageGap,
        imageGrid,
        optimizeImages,
        imageQuality,
        maxImageDimension,
      });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = cleanPdfName(outputName || sourceName || copy.output.placeholder);
      setPdfUrl(url);
      setPdfFileName(fileName);
      setStatus(copy.status.ready(pagePlan.length));
      setShowSuccessModal(true);
    } catch (pdfError) {
      setError(pdfError.message || copy.errors.generatePdf);
      setStatus('');
    } finally {
      setIsBusy(false);
    }
  }

  function clearAll() {
    revokePdf();
    revokeImageItems(images);
    setImages([]);
    setIgnoredCount(0);
    setSourceName('');
    setOutputName('');
    setStatus('');
    setError('');
    setSelectedPageIndex(0);
  }

  function movePage(fromIndex, toIndex) {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    const pages = groupPdfPages(images, imagesPerPage);
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);
    setImages(pages.flat());
    setSelectedPageIndex(toIndex);
    setDragPageIndex(null);
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="panel upload-panel">
          <UploadPanel
            imageInputRef={imageInputRef}
            folderInputRef={folderInputRef}
            archiveInputRef={archiveInputRef}
            sourceName={sourceName}
            imageCount={images.length}
            ignoredCount={ignoredCount}
            totalSize={totalSize}
            onDrop={handleDrop}
            onImageChange={handleImageChange}
            onFolderChange={handleFolderChange}
            onArchiveChange={handleArchiveChange}
          />

          <CompositionPanel
            pageCount={pagePlan.length}
            hasImages={images.length > 0}
            imagesPerPage={imagesPerPage}
            layoutMode={layoutMode}
            pagePreset={pagePreset}
            orientation={orientation}
            margin={margin}
            gap={gap}
            gridColumns={gridColumns}
            gridRows={gridRows}
            optimizeImages={optimizeImages}
            imageQuality={imageQuality}
            maxImageDimension={maxImageDimension}
            onImagesPerPageChange={(count) => {
              setImagesPerPage(count);
              setSelectedPageIndex(0);
            }}
            onLayoutModeChange={setLayoutMode}
            onPagePresetChange={setPagePreset}
            onOrientationChange={setOrientation}
            onMarginChange={setMargin}
            onGapChange={setGap}
            onGridColumnsChange={setGridColumns}
            onGridRowsChange={setGridRows}
            onOptimizeImagesChange={setOptimizeImages}
            onImageQualityChange={setImageQuality}
            onMaxImageDimensionChange={setMaxImageDimension}
          />

          <label className="control-field output-name-field">
            <span>{copy.output.fileName}</span>
            <input
              type="text"
              value={outputName}
              placeholder={copy.output.placeholder}
              onChange={(event) => {
                revokePdf();
                setOutputName(event.target.value);
              }}
            />
          </label>

          <div className="actions">
            <button type="button" className="primary" onClick={handleGeneratePdf} disabled={isBusy || images.length === 0 || pagePlan.length === 0}>
              {isBusy ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
              {copy.actions.generate}
            </button>
            <button type="button" onClick={clearAll} disabled={isBusy && !images.length}>
              <RefreshCw size={18} />
              {copy.actions.clear}
            </button>
            {pdfUrl && (
              <>
                <a href={pdfUrl} target="_blank">
                  <Eye size={18} />
                  {copy.actions.preview(pdfFileName)}
                </a>
                <a href={pdfUrl} download={pdfFileName}>
                  <Download size={18} />
                  {copy.actions.download}
                </a>
              </>
            )}
          </div>

          {status && <p className="status">{status}</p>}
          {error && (
            <p className="error">
              <X size={16} />
              {error}
            </p>
          )}
        </div>
      </section>

      <SelectedPagePanel
        activePageIndex={activePageIndex}
        activePageItems={activePageItems}
        layoutMode={layoutMode}
        pageSize={previewPaper}
        margin={pageMargin}
        gap={pageGap}
        imageGrid={imageGrid}
      />

      <PageListPreview
        pagePlan={pagePlan}
        activePageIndex={activePageIndex}
        layoutMode={layoutMode}
        pageSize={previewPaper}
        margin={pageMargin}
        gap={pageGap}
        imageGrid={imageGrid}
        onSelectPage={setSelectedPageIndex}
        onDragStart={setDragPageIndex}
        onDropPage={(pageIndex) => movePage(dragPageIndex, pageIndex)}
        onDragEnd={() => setDragPageIndex(null)}
      />

      <BusyOverlay isOpen={isBusy} message={status} />

      <SuccessModal
        isOpen={showSuccessModal}
        pdfUrl={pdfUrl}
        pdfFileName={pdfFileName}
        onClose={() => setShowSuccessModal(false)}
      />
    </main>
  );
}
