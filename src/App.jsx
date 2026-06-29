import React, { useMemo, useRef, useState } from 'react';
import { FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { BusyOverlay } from './components/BusyOverlay.jsx';
import { CompositionPanel } from './components/CompositionPanel.jsx';
import { PageListPreview, SelectedPagePanel } from './components/PreviewPanels.jsx';
import { SuccessModal } from './components/SuccessModal.jsx';
import { SummaryPanel } from './components/SummaryPanel.jsx';
import { UploadPanel } from './components/UploadPanel.jsx';
import { useCompositionOptions } from './hooks/useCompositionOptions.js';
import { SUPPORTED_LABEL } from './lib/constants.js';
import { copy } from './lib/copy.js';
import {
  cleanPdfName,
  folderNameFromItems,
  revokeImageItems,
} from './lib/fileUtils.js';
import { groupPdfPages } from './lib/layout.js';
import { buildPdf } from './lib/pdf.js';
import { archiveFromFiles, loadArchiveSource, loadImageSource } from './lib/sourceLoaders.js';

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
  const [progress, setProgress] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dragPageIndex, setDragPageIndex] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const { options, updateOption, imageGrid, pageGap, pageMargin, previewPaper } = useCompositionOptions();

  const totalSize = useMemo(() => images.reduce((sum, item) => sum + item.file.size, 0), [images]);
  const pagePlan = useMemo(() => groupPdfPages(images, options.imagesPerPage), [images, options.imagesPerPage]);
  const activePageIndex = pagePlan.length ? Math.min(selectedPageIndex, pagePlan.length - 1) : 0;
  const activePageItems = pagePlan[activePageIndex] || [];

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

  async function loadSource(statusMessage, loader) {
    setIsBusy(true);
    setProgress(null);
    setError('');
    setStatus(statusMessage);
    try {
      const result = await loader();
      applyImages(result.images, result.ignored, result.sourceName, result.status);
    } catch (sourceError) {
      setError(sourceError.message || copy.errors.archiveRead);
      setStatus('');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImageChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;

    await loadSource(copy.status.readingImages, () => loadImageSource(files));
  }

  async function handleFolderChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;

    await loadSource(copy.status.readingFolder, () => loadImageSource(files, ''));
  }

  async function handleArchiveChange(event) {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;

    await loadSource(copy.status.readingArchive, () => loadArchiveSource(file));
  }

  async function handleDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const archive = archiveFromFiles(files);
    if (archive) {
      await loadSource(copy.status.readingArchive, () => loadArchiveSource(archive));
      return;
    }

    if (!files.length) return;
    await loadSource(copy.status.readingImages, () => loadImageSource(files));
  }

  async function handleGeneratePdf() {
    if (!images.length) {
      setError(copy.errors.noSelection);
      return;
    }

    setIsBusy(true);
    setProgress({
      current: 0,
      message: copy.loading.message,
      total: images.length + pagePlan.length + 1,
    });
    setError('');
    revokePdf();

    try {
      const bytes = await buildPdf(images, (nextProgress) => {
        setStatus(nextProgress.message);
        setProgress(nextProgress);
      }, {
        ...options,
        margin: pageMargin,
        gap: pageGap,
        imageGrid,
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
      setProgress(null);
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
    const pages = groupPdfPages(images, options.imagesPerPage);
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);
    setImages(pages.flat());
    setSelectedPageIndex(toIndex);
    setDragPageIndex(null);
  }

  function updateImagesPerPage(count) {
    updateOption('imagesPerPage', count);
    setSelectedPageIndex(0);
  }

  return (
    <>
      <nav className="top-nav">
        <div className="brand-name">{copy.appTitle}</div>
      </nav>

      <main className="app-shell">
        <header className="hero-section animate-in">
          <h1>{copy.hero.title}</h1>
          <p>{copy.hero.subtitle}</p>
        </header>

        <UploadPanel
          imageInputRef={imageInputRef}
          folderInputRef={folderInputRef}
          archiveInputRef={archiveInputRef}
          onDrop={handleDrop}
          onImageChange={handleImageChange}
          onFolderChange={handleFolderChange}
          onArchiveChange={handleArchiveChange}
        />

        <section className="config-grid animate-in">
          <CompositionPanel
            pageCount={pagePlan.length}
            hasImages={images.length > 0}
            options={options}
            onOptionChange={updateOption}
            onImagesPerPageChange={updateImagesPerPage}
          />

          <SummaryPanel
            sourceName={sourceName}
            imageCount={images.length}
            ignoredCount={ignoredCount}
            totalSize={totalSize}
            outputName={outputName}
            onOutputNameChange={(value) => {
              revokePdf();
              setOutputName(value);
            }}
            pdfUrl={pdfUrl}
            pdfFileName={pdfFileName}
          />
        </section>

        <section className="preview-layout animate-in">
          <SelectedPagePanel
            activePageIndex={activePageIndex}
            activePageItems={activePageItems}
            layoutMode={options.layoutMode}
            pageSize={previewPaper}
            margin={pageMargin}
            gap={pageGap}
            imageGrid={imageGrid}
            pageCount={pagePlan.length}
          />

          <PageListPreview
            pagePlan={pagePlan}
            activePageIndex={activePageIndex}
            layoutMode={options.layoutMode}
            pageSize={previewPaper}
            margin={pageMargin}
            gap={pageGap}
            imageGrid={imageGrid}
            onSelectPage={setSelectedPageIndex}
            onDragStart={setDragPageIndex}
            onDropPage={(pageIndex) => movePage(dragPageIndex, pageIndex)}
            onDragEnd={() => setDragPageIndex(null)}
          />
        </section>

        {(status || error) && (
          <section className="message-strip">
            {status && <p className="status">{status}</p>}
            {error && (
              <p className="error">
                <X size={16} />
                {error}
              </p>
            )}
          </section>
        )}
      </main>

      <div className="floating-action-bar">
        <div className="glass-card action-pill">
          <button type="button" onClick={clearAll} disabled={isBusy && !images.length}>
            <RefreshCw size={18} />
            {copy.actions.clear}
          </button>
          <button type="button" className="primary" onClick={handleGeneratePdf} disabled={isBusy || images.length === 0 || pagePlan.length === 0}>
            {isBusy ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
            {copy.actions.generate}
          </button>
        </div>
      </div>

      <footer className="app-footer">
        <strong>{copy.appTitle}</strong>
        <span>{copy.footer}</span>
      </footer>

      <BusyOverlay isOpen={isBusy} message={status} progress={progress} />

      <SuccessModal
        isOpen={showSuccessModal}
        pdfUrl={pdfUrl}
        pdfFileName={pdfFileName}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
}
