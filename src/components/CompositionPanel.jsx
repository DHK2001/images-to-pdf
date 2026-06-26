import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants.js';
import { copy } from '../lib/copy.js';

export function CompositionPanel({
  pageCount,
  hasImages,
  imagesPerPage,
  layoutMode,
  pagePreset,
  orientation,
  margin,
  gap,
  gridColumns,
  gridRows,
  onImagesPerPageChange,
  onLayoutModeChange,
  onPagePresetChange,
  onOrientationChange,
  onMarginChange,
  onGapChange,
  onGridColumnsChange,
  onGridRowsChange,
}) {
  return (
    <div className="compose-panel">
      <div className="compose-header">
        <div>
          <h2>{copy.composition.title}</h2>
          <p>{hasImages ? copy.composition.estimated(pageCount) : copy.composition.empty}</p>
        </div>
        <LayoutGrid size={20} />
      </div>

      <label className="field-label">{copy.composition.format}</label>
      <div className="segmented-control two" role="group" aria-label={copy.composition.format}>
        <button type="button" className={layoutMode === 'exact' ? 'selected' : ''} onClick={() => onLayoutModeChange('exact')}>
          {copy.composition.exact}
        </button>
        <button type="button" className={layoutMode === 'paper' ? 'selected' : ''} onClick={() => onLayoutModeChange('paper')}>
          {copy.composition.paper}
        </button>
      </div>

      <label className="field-label">{copy.composition.imagesPerPage}</label>
      <div className="segmented-control ten" role="group" aria-label={copy.composition.imagesPerPage}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
          <button
            type="button"
            className={imagesPerPage === count ? 'selected' : ''}
            key={count}
            onClick={() => onImagesPerPageChange(count)}
          >
            {count}
          </button>
        ))}
      </div>

      <label className="field-label">{copy.composition.exactGrid}</label>
      <div className="advanced-grid">
          <label className="control-field">
            <span>{copy.composition.columns}</span>
            <select value={gridColumns} onChange={(event) => onGridColumnsChange(Number(event.target.value))}>
              <option value="0">{copy.composition.auto}</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label className="control-field">
            <span>{copy.composition.rows}</span>
            <select value={gridRows} onChange={(event) => onGridRowsChange(Number(event.target.value))}>
              <option value="0">{copy.composition.auto}</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <p className="field-help">{copy.composition.gridHint}</p>
      </div>

      {layoutMode === 'paper' && (
        <div className="advanced-grid">
          <label className="control-field">
            <span>{copy.composition.pageSize}</span>
            <select value={pagePreset} onChange={(event) => onPagePresetChange(event.target.value)}>
              {Object.entries(PAGE_SIZES).map(([value, page]) => (
                <option value={value} key={value}>
                  {page.label}
                </option>
              ))}
            </select>
          </label>

          <label className="control-field">
            <span>{copy.composition.orientation}</span>
            <select value={orientation} onChange={(event) => onOrientationChange(event.target.value)}>
              <option value="portrait">{copy.composition.portrait}</option>
              <option value="landscape">{copy.composition.landscape}</option>
            </select>
          </label>

          <label className="control-field">
            <span>{copy.composition.margin(margin)}</span>
            <input type="range" min="0" max="96" step="6" value={margin} onChange={(event) => onMarginChange(Number(event.target.value))} />
          </label>

          <label className="control-field">
            <span>{copy.composition.gap(gap)}</span>
            <input type="range" min="0" max="72" step="6" value={gap} onChange={(event) => onGapChange(Number(event.target.value))} />
          </label>
        </div>
      )}
    </div>
  );
}
