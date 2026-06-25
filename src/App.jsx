import React, { useMemo, useRef, useState } from 'react';
import { Download, Eye, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { CompositionPanel } from './components/CompositionPanel.jsx';
import { PageListPreview, SelectedPagePanel } from './components/PreviewPanels.jsx';
import { SuccessModal } from './components/SuccessModal.jsx';
import { UploadPanel } from './components/UploadPanel.jsx';
import { DEFAULT_OPTIONS, SUPPORTED_LABEL } from './lib/constants.js';
import { copy } from './lib/copy.js';
import {
  cleanPdfName,
  extensionOf,
  fileBaseName,
  filesFromZip,
  folderNameFromItems,
  revokeImageItems,
  splitImageItems,
} from './lib/fileUtils.js';
import { groupPdfPages, pageDimensions } from './lib/layout.js';
import { buildPdf } from './lib/pdf.js';

export function App() {
  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [sourceName, setSourceName] = useState('');
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
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const totalSize = useMemo(() => images.reduce((sum, item) => sum + item.file.size, 0), [images]);
  const pagePlan = useMemo(() => groupPdfPages(images, imagesPerPage), [images, imagesPerPage]);
  const activePageIndex = pagePlan.length ? Math.min(selectedPageIndex, pagePlan.length - 1) : 0;
  const activePageItems = pagePlan[activePageIndex] || [];
  const previewPaper = pageDimensions(pagePreset, orientation);
  const pageMargin = layoutMode === 'paper' ? margin : 0;
  const pageGap = layoutMode === 'paper' ? gap : 0;

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
    setSourceName(nextSourceName || folderNameFromItems(nextImages));
    setSelectedPageIndex(0);

    if (!nextImages.length) {
      setStatus('');
      setError(copy.errors.noImages(SUPPORTED_LABEL));
      return;
    }

    const ignoredText = nextIgnored ? copy.status.ignoredFiles(nextIgnored) : '';
    setStatus(nextStatus || copy.status.loaded(nextImages.length, ignoredText));
  }

  async function handleFolderChange(event) {
    const result = await splitImageItems(event.target.files);
    applyImages(result.images, result.ignored, '');
    event.target.value = '';
  }

  async function handleZipChange(event) {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;

    setIsBusy(true);
    setError('');
    setStatus(copy.status.readingZip);
    try {
      const result = await filesFromZip(file);
      const ignoredText = result.ignored ? copy.status.ignoredFiles(result.ignored) : '';
      applyImages(result.images, result.ignored, result.sourceName, copy.status.loadedZip(result.images.length, ignoredText));
    } catch (zipError) {
      setError(zipError.message || copy.errors.zipRead);
      setStatus('');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const zip = files.find((file) => extensionOf(file.name) === '.zip');
    if (zip) {
      setIsBusy(true);
      setError('');
      setStatus(copy.status.readingZip);
      try {
        const result = await filesFromZip(zip);
        const ignoredText = result.ignored ? copy.status.ignoredFiles(result.ignored) : '';
        applyImages(result.images, result.ignored, result.sourceName, copy.status.loadedZip(result.images.length, ignoredText));
      } catch (zipError) {
        setError(zipError.message || copy.errors.zipRead);
        setStatus('');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const result = await splitImageItems(files);
    applyImages(result.images, result.ignored, files.length === 1 ? fileBaseName(files[0].name) : 'images');
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
      });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = cleanPdfName(sourceName);
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
            folderInputRef={folderInputRef}
            zipInputRef={zipInputRef}
            sourceName={sourceName}
            imageCount={images.length}
            ignoredCount={ignoredCount}
            totalSize={totalSize}
            onDrop={handleDrop}
            onFolderChange={handleFolderChange}
            onZipChange={handleZipChange}
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
            onImagesPerPageChange={(count) => {
              setImagesPerPage(count);
              setSelectedPageIndex(0);
            }}
            onLayoutModeChange={setLayoutMode}
            onPagePresetChange={setPagePreset}
            onOrientationChange={setOrientation}
            onMarginChange={setMargin}
            onGapChange={setGap}
          />

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
      />

      <PageListPreview
        pagePlan={pagePlan}
        activePageIndex={activePageIndex}
        layoutMode={layoutMode}
        pageSize={previewPaper}
        margin={pageMargin}
        gap={pageGap}
        onSelectPage={setSelectedPageIndex}
        onDragStart={setDragPageIndex}
        onDropPage={(pageIndex) => movePage(dragPageIndex, pageIndex)}
        onDragEnd={() => setDragPageIndex(null)}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        pdfUrl={pdfUrl}
        pdfFileName={pdfFileName}
        onClose={() => setShowSuccessModal(false)}
      />
    </main>
  );
}
