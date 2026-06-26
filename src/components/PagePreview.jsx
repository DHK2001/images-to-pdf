import React from 'react';
import { previewSizeForExact, slotsForPreview } from '../lib/layout.js';

export function PagePreview({ items, layoutMode, pageSize, margin, gap, imageGrid, isLarge = false }) {
  const isPaper = layoutMode === 'paper';
  const previewPage = isPaper ? pageSize : previewSizeForExact(items, imageGrid);
  const slots = slotsForPreview(items.length, previewPage.width, previewPage.height, margin, gap, imageGrid);
  const largeWidth = previewPage.width >= previewPage.height ? 820 : 560;
  const pageRatio = previewPage.width / previewPage.height;

  return (
    <div
      className={`page-preview ${isPaper ? 'paper-preview' : 'exact-preview'} ${isLarge ? 'focus-preview' : ''}`}
      style={{
        aspectRatio: `${previewPage.width} / ${previewPage.height}`,
        ...(isLarge ? { width: `min(100%, ${largeWidth}px, calc(70vh * ${pageRatio}))` } : {}),
      }}
    >
      {items.map((item, index) => {
        const slot = slots[index];
        return (
          <div
            className="preview-slot"
            key={item.id}
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
          >
            <img src={item.previewUrl} alt="" />
          </div>
        );
      })}
    </div>
  );
}
