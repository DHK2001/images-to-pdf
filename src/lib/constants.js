export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif', '.heic', '.heif'];
export const DIRECT_PDF_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
export const SUPPORTED_LABEL = 'JPG, PNG, WEBP, GIF, BMP, AVIF, HEIC o HEIF';

export const PAGE_SIZES = {
  letter: { label: 'Carta', width: 612, height: 792 },
  a4: { label: 'A4', width: 595.28, height: 841.89 },
  legal: { label: 'Legal', width: 612, height: 1008 },
};

export const DEFAULT_OPTIONS = {
  imagesPerPage: 1,
  layoutMode: 'exact',
  pagePreset: 'letter',
  orientation: 'portrait',
  margin: 36,
  gap: 18,
  gridColumns: 0,
  gridRows: 0,
  optimizeImages: true,
  imageQuality: 0.82,
  maxImageDimension: 1800,
};
