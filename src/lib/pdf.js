import { PDFDocument } from 'pdf-lib';
import { DIRECT_PDF_EXTENSIONS } from './constants.js';
import { copy } from './copy.js';
import { extensionOf } from './fileUtils.js';
import { fitInto, gridForCount, groupPdfPages, pageDimensions, slotsForPage } from './layout.js';

async function imageFileToBytes(file, options) {
  if (options.optimizeImages) {
    return {
      bytes: await rasterizeToJpegBytes(file, options),
      type: 'jpg',
    };
  }

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

async function embedImageFromFile(pdf, file, options) {
  const { bytes, type } = await imageFileToBytes(file, options);
  const image = type === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  return { image, width: image.width, height: image.height };
}

async function rasterizeToJpegBytes(file, options) {
  const bitmap = await bitmapFromFile(file);
  const maxDimension = Number(options.maxImageDimension) || 0;
  const scale = maxDimension > 0 ? Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height)) : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, 'image/jpeg', options.imageQuality);
  return new Uint8Array(await blob.arrayBuffer());
}

async function rasterizeToPngBytes(file) {
  const bitmap = await bitmapFromFile(file);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, 'image/png');

  return new Uint8Array(await blob.arrayBuffer());
}

async function bitmapFromFile(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(copy.errors.convertImage(file.name));
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error(copy.errors.pngConvert));
    }, type, quality);
  });
}

export async function buildPdf(items, onProgress, options) {
  const pdf = await PDFDocument.create();
  const pages = groupPdfPages(items, options.imagesPerPage);

  for (const [pageIndex, pageItems] of pages.entries()) {
    onProgress(copy.status.processingPage(pageIndex + 1, pages.length));
    const embeddedImages = [];
    for (const [imageIndex, item] of pageItems.entries()) {
      if (options.optimizeImages) {
        onProgress(copy.status.optimizingImage(pageIndex * options.imagesPerPage + imageIndex + 1, items.length));
      }
      embeddedImages.push(await embedImageFromFile(pdf, item.file, options));
    }

    if (options.layoutMode === 'exact' && embeddedImages.length === 1) {
      const [{ image, width, height }] = embeddedImages;
      const page = pdf.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
      continue;
    }

    if (options.layoutMode === 'exact') {
      const { cols, rows } = gridForCount(embeddedImages.length, options.imageGrid);
      const cellWidth = Math.max(...embeddedImages.map((entry) => entry.width));
      const cellHeight = Math.max(...embeddedImages.map((entry) => entry.height));
      const pageWidth = cellWidth * cols;
      const pageHeight = cellHeight * rows;
      const page = pdf.addPage([pageWidth, pageHeight]);
      const slots = slotsForPage(embeddedImages.length, pageWidth, pageHeight, 0, 0, options.imageGrid);

      embeddedImages.forEach((entry, index) => {
        page.drawImage(entry.image, fitInto(entry, slots[index]));
      });
      continue;
    }

    const paper = pageDimensions(options.pagePreset, options.orientation);
    const page = pdf.addPage([paper.width, paper.height]);
    const slots = slotsForPage(embeddedImages.length, paper.width, paper.height, options.margin, options.gap, options.imageGrid);

    embeddedImages.forEach((entry, index) => {
      page.drawImage(entry.image, fitInto(entry, slots[index]));
    });
  }

  onProgress(copy.status.finishing);
  return pdf.save();
}
