import { copy } from './copy.js';
import { filesFromArchive, isSupportedArchive, splitImageItems } from './fileUtils.js';

export function archiveFromFiles(files) {
  return Array.from(files).find((file) => isSupportedArchive(file.name));
}

export async function loadImageSource(files, fallbackSourceName = copy.output.placeholder) {
  const result = await splitImageItems(files);
  return {
    images: result.images,
    ignored: result.ignored,
    sourceName: fallbackSourceName,
    status: copy.status.loaded(result.images.length, ignoredText(result.ignored)),
  };
}

export async function loadArchiveSource(file) {
  const result = await filesFromArchive(file);
  return {
    images: result.images,
    ignored: result.ignored,
    sourceName: result.sourceName,
    status: copy.status.loadedArchive(result.images.length, ignoredText(result.ignored)),
  };
}

function ignoredText(count) {
  return count ? copy.status.ignoredFiles(count) : '';
}
