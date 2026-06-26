import React from 'react';
import { FileText, GripVertical } from 'lucide-react';
import { copy } from '../lib/copy.js';
import { PagePreview } from './PagePreview.jsx';

export function SelectedPagePanel({ activePageIndex, activePageItems, layoutMode, pageSize, margin, gap, imageGrid }) {
  return (
    <section className="panel focus-panel">
      <div className="panel-header">
        <div>
          <h2>{copy.selectedPage.title}</h2>
          <p>{activePageItems.length ? copy.selectedPage.loaded(activePageIndex + 1) : copy.selectedPage.empty}</p>
        </div>
      </div>

      {activePageItems.length ? (
        <div className="focus-preview-wrap">
          <PagePreview isLarge items={activePageItems} layoutMode={layoutMode} pageSize={pageSize} margin={margin} gap={gap} imageGrid={imageGrid} />
        </div>
      ) : (
        <EmptyPreview text={copy.selectedPage.placeholder} />
      )}
    </section>
  );
}

export function PageListPreview({
  pagePlan,
  activePageIndex,
  layoutMode,
  pageSize,
  margin,
  gap,
  imageGrid,
  onSelectPage,
  onDragStart,
  onDropPage,
  onDragEnd,
}) {
  return (
    <section className="panel live-preview-panel">
      <div className="panel-header">
        <div>
          <h2>{copy.preview.title}</h2>
          <p>{pagePlan.length ? copy.preview.loaded : copy.preview.empty}</p>
        </div>
      </div>

      <div className="page-preview-grid">
        {pagePlan.length === 0 ? (
          <EmptyPreview text={copy.preview.placeholder} />
        ) : (
          pagePlan.map((pageItems, pageIndex) => (
            <button
              type="button"
              className={`page-preview-card ${pageIndex === activePageIndex ? 'selected-page-card' : ''}`}
              key={`preview-${pageIndex}-${pageItems.map((item) => item.id).join('-')}`}
              draggable
              onClick={() => onSelectPage(pageIndex)}
              onDragStart={() => onDragStart(pageIndex)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onDropPage(pageIndex);
              }}
              onDragEnd={onDragEnd}
            >
              <span className="preview-page-number">
                <GripVertical size={14} />
                {copy.preview.pageLabel(pageIndex + 1)}
              </span>
              <PagePreview items={pageItems} layoutMode={layoutMode} pageSize={pageSize} margin={margin} gap={gap} imageGrid={imageGrid} />
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyPreview({ text }) {
  return (
    <div className="empty-state">
      <FileText size={38} />
      <span>{text}</span>
    </div>
  );
}
