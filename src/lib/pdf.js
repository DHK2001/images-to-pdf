import { PDFDocument } from 'pdf-lib';
import { DIRECT_PDF_EXTENSIONS } from './constants.js';
import { copy } from './copy.js';
import { extensionOf } from './fileUtils.js';
import { fitInto, gridForCount, groupPdfPages, pageDimensions, slotsForPage } from './layout.js';

async function imageFileToBytes(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = extensionOf(file.name);

  if (DIRECT_PDF_EXTENSIONS.includes(ext)) {
    return { bytes, type: ext === '.png' ? 'png' : 'jpg' };
  }

  return {
    bytes: await rasterizeToPngBytes(file),
    type: 'png',
  };
}

async function embedImageFromFile(pdf, file) {
  const { bytes, type } = await imageFileToBytes(file);
  const image = type === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  return { image, width: image.width, height: image.height };
}

async function rasterizeToPngBytes(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(copy.errors.convertImage(file.name));
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error(copy.errors.pngConvert));
    }, 'image/png');
  });

  return new Uint8Array(await blob.arrayBuffer());
}

export async function buildPdf(items, onProgress, options) {
  const pdf = await PDFDocument.create();
  const pages = groupPdfPages(items, options.imagesPerPage);

  for (const [pageIndex, pageItems] of pages.entries()) {
    onProgress(copy.status.processingPage(pageIndex + 1, pages.length));
    const embeddedImages = await Promise.all(pageItems.map((item) => embedImageFromFile(pdf, item.file)));

    if (options.layoutMode === 'exact' && embeddedImages.length === 1) {
      const [{ image, width, height }] = embeddedImages;
      const page = pdf.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
      continue;
    }

    if (options.layoutMode === 'exact') {
      const { cols, rows } = gridForCount(embeddedImages.length);
      const cellWidth = Math.max(...embeddedImages.map((entry) => entry.width));
      const cellHeight = Math.max(...embeddedImages.map((entry) => entry.height));
      const pageWidth = cellWidth * cols;
      const pageHeight = cellHeight * rows;
      const page = pdf.addPage([pageWidth, pageHeight]);
      const slots = slotsForPage(embeddedImages.length, pageWidth, pageHeight);

      embeddedImages.forEach((entry, index) => {
        page.drawImage(entry.image, fitInto(entry, slots[index]));
      });
      continue;
    }

    const paper = pageDimensions(options.pagePreset, options.orientation);
    const page = pdf.addPage([paper.width, paper.height]);
    const slots = slotsForPage(embeddedImages.length, paper.width, paper.height, options.margin, options.gap);

    embeddedImages.forEach((entry, index) => {
      page.drawImage(entry.image, fitInto(entry, slots[index]));
    });
  }

  onProgress(copy.status.finishing);
  return pdf.save();
}
