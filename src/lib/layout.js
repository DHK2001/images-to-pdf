import { PAGE_SIZES } from './constants.js';

export function groupPdfPages(items, imagesPerPage) {
  const pages = [];
  for (let index = 0; index < items.length; index += imagesPerPage) {
    pages.push(items.slice(index, index + imagesPerPage));
  }
  return pages;
}

export function gridForCount(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 1, rows: 2 };
  if (count === 3 || count === 4) return { cols: 2, rows: 2 };
  const cols = Math.ceil(Math.sqrt(count));
  return { cols, rows: Math.ceil(count / cols) };
}

export function pageDimensions(pagePreset, orientation) {
  const preset = PAGE_SIZES[pagePreset] || PAGE_SIZES.letter;
  return orientation === 'landscape'
    ? { width: preset.height, height: preset.width }
    : { width: preset.width, height: preset.height };
}

export function fitInto(image, slot) {
  const scale = Math.min(slot.width / image.width, slot.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: slot.x + (slot.width - width) / 2,
    y: slot.y + (slot.height - height) / 2,
    width,
    height,
  };
}

export function slotsForPage(count, pageWidth, pageHeight, margin = 0, gap = 0) {
  const { cols, rows } = gridForCount(count);
  const contentWidth = Math.max(1, pageWidth - margin * 2 - gap * (cols - 1));
  const contentHeight = Math.max(1, pageHeight - margin * 2 - gap * (rows - 1));
  const cellWidth = contentWidth / cols;
  const cellHeight = contentHeight / rows;

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: margin + col * (cellWidth + gap),
      y: pageHeight - margin - (row + 1) * cellHeight - row * gap,
      width: cellWidth,
      height: cellHeight,
    };
  });
}

export function previewSizeForExact(items) {
  const { cols, rows } = gridForCount(items.length);
  const cellWidth = Math.max(...items.map((item) => item.width || 1));
  const cellHeight = Math.max(...items.map((item) => item.height || 1));
  return { width: cols * cellWidth, height: rows * cellHeight };
}

export function slotsForPreview(count, pageWidth, pageHeight, margin, gap) {
  const slots = slotsForPage(count, pageWidth, pageHeight, margin, gap);
  return slots.map((slot) => ({
    x: (slot.x / pageWidth) * 100,
    y: ((pageHeight - slot.y - slot.height) / pageHeight) * 100,
    width: (slot.width / pageWidth) * 100,
    height: (slot.height / pageHeight) * 100,
  }));
}
