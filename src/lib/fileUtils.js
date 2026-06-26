import JSZip from 'jszip';
import { createExtractorFromData } from 'node-unrar-js/esm/index.esm.js';
import unrarWasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';
import { IMAGE_EXTENSIONS } from './constants.js';

let unrarWasmBinaryPromise;

export function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function extensionOf(name) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function isSupportedImage(name) {
  return IMAGE_EXTENSIONS.includes(extensionOf(name));
}

export function isSupportedArchive(name) {
  return ['.zip', '.rar'].includes(extensionOf(name));
}

export function fileBaseName(name) {
  return name.replace(/\.[^/.]+$/, '');
}

export function cleanPdfName(name) {
  const safeName = (name || 'images').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return `${safeName || 'images'}.pdf`;
}

export async function imageItemFromFile(file, displayPath = '') {
  const dimensions = await imageDimensions(file);
  return {
    id: crypto.randomUUID(),
    file,
    displayPath: displayPath || file.webkitRelativePath || file.name,
    previewUrl: URL.createObjectURL(file),
    width: dimensions.width,
    height: dimensions.height,
  };
}

export async function splitImageItems(files) {
  const allFiles = Array.from(files);
  const validFiles = allFiles
    .filter((file) => isSupportedImage(file.webkitRelativePath || file.name))
    .sort((a, b) => naturalCompare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));

  return {
    images: await Promise.all(validFiles.map((file) => imageItemFromFile(file))),
    ignored: allFiles.length - validFiles.length,
  };
}

async function imageDimensions(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  } catch {
    return { width: 1, height: 1 };
  }
}

export function revokeImageItems(items) {
  items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
}

export function folderNameFromItems(items) {
  const firstPath = items.find((item) => item.displayPath?.includes('/'))?.displayPath;
  if (firstPath) return firstPath.split('/')[0];
  return items.length === 1 ? fileBaseName(items[0].file.name) : 'images';
}

export function mimeTypeFromName(name) {
  const ext = extensionOf(name);
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.heic') return 'image/heic';
  if (ext === '.heif') return 'image/heif';
  return 'application/octet-stream';
}

export async function filesFromArchive(file) {
  const extension = extensionOf(file.name);
  if (extension === '.zip') return filesFromZip(file);
  if (extension === '.rar') return filesFromRar(file);
  throw new Error('Unsupported archive file.');
}

export async function filesFromZip(file) {
  const zip = await JSZip.loadAsync(file);
  const fileEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && !entry.name.startsWith('__MACOSX/') && !entry.name.endsWith('.DS_Store'),
  );
  const entries = fileEntries
    .filter((entry) => isSupportedImage(entry.name))
    .sort((a, b) => naturalCompare(a.name, b.name));

  const images = await Promise.all(
    entries.map(async (entry) => {
      const blob = await entry.async('blob');
      const zipFile = new File([blob], entry.name.split('/').pop(), {
        type: blob.type || mimeTypeFromName(entry.name),
        lastModified: file.lastModified,
      });
      return imageItemFromFile(zipFile, entry.name);
    }),
  );

  return {
    sourceName: fileBaseName(file.name),
    images,
    ignored: fileEntries.length - images.length,
  };
}

async function filesFromRar(file) {
  const extractor = await createExtractorFromData({
    data: await file.arrayBuffer(),
    wasmBinary: await getUnrarWasmBinary(),
  });

  const list = extractor.getFileList();
  const fileHeaders = [...list.fileHeaders].filter((header) => {
    const name = normalizeArchivePath(header.name);
    return !header.flags.directory && !name.startsWith('__MACOSX/') && !name.endsWith('.DS_Store');
  });
  const imageHeaders = fileHeaders
    .filter((header) => isSupportedImage(header.name))
    .sort((a, b) => naturalCompare(a.name, b.name));

  if (!imageHeaders.length) {
    return {
      sourceName: fileBaseName(file.name),
      images: [],
      ignored: fileHeaders.length,
    };
  }

  const extracted = extractor.extract({ files: imageHeaders.map((header) => header.name) });
  const extractedFiles = [...extracted.files].filter((entry) => entry.extraction);
  const images = await Promise.all(
    extractedFiles.map((entry) => {
      const archivePath = normalizeArchivePath(entry.fileHeader.name);
      const blob = new Blob([entry.extraction], { type: mimeTypeFromName(archivePath) });
      const rarFile = new File([blob], archivePath.split('/').pop(), {
        type: blob.type,
        lastModified: file.lastModified,
      });
      return imageItemFromFile(rarFile, archivePath);
    }),
  );

  images.sort((a, b) => naturalCompare(a.displayPath, b.displayPath));

  return {
    sourceName: fileBaseName(file.name),
    images,
    ignored: fileHeaders.length - images.length,
  };
}

async function getUnrarWasmBinary() {
  if (!unrarWasmBinaryPromise) {
    unrarWasmBinaryPromise = fetch(unrarWasmUrl).then((response) => {
      if (!response.ok) throw new Error('The RAR reader could not be loaded.');
      return response.arrayBuffer();
    });
  }
  return unrarWasmBinaryPromise;
}

function normalizeArchivePath(path) {
  return path.replaceAll('\\', '/');
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
