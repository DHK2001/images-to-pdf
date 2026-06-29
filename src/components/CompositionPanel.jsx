import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { PAGE_SIZES } from '../lib/constants.js';
import { copy } from '../lib/copy.js';

export function CompositionPanel({
  pageCount,
  hasImages,
  options,
  onOptionChange,
  onImagesPerPageChange,
}) {
  const {
    imagesPerPage,
    layoutMode,
    pagePreset,
    orientation,
    margin,
    gap,
    gridColumns,
    gridRows,
    optimizeImages,
    imageQuality,
    maxImageDimension,
  } = options;

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
        <button type="button" className={layoutMode === 'exact' ? 'selected' : ''} onClick={() => onOptionChange('layoutMode', 'exact')}>
          {copy.composition.exact}
        </button>
        <button type="button" className={layoutMode === 'paper' ? 'selected' : ''} onClick={() => onOptionChange('layoutMode', 'paper')}>
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
            <select value={gridColumns} onChange={(event) => onOptionChange('gridColumns', Number(event.target.value))}>
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
            <select value={gridRows} onChange={(event) => onOptionChange('gridRows', Number(event.target.value))}>
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


      <label className="field-label">{copy.composition.optimization}</label>
      <div className="advanced-grid">
        <label className="control-field checkbox-field">
          <span>{copy.composition.optimizeImages}</span>
          <input type="checkbox" checked={optimizeImages} onChange={(event) => onOptionChange('optimizeImages', event.target.checked)} />
        </label>

        <label className="control-field">
          <span>{copy.composition.maxDimension}</span>
          <select value={maxImageDimension} disabled={!optimizeImages} onChange={(event) => onOptionChange('maxImageDimension', Number(event.target.value))}>
            <option value="0">{copy.composition.originalSize}</option>
            {[1200, 1800, 2400, 3200].map((value) => (
              <option value={value} key={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>

        <label className="control-field">
          <span>{copy.composition.quality(imageQuality)}</span>
          <input
            type="range"
            min="0.55"
            max="0.95"
            step="0.05"
            value={imageQuality}
            disabled={!optimizeImages}
            onChange={(event) => onOptionChange('imageQuality', Number(event.target.value))}
          />
        </label>

        <p className="field-help">{copy.composition.optimizeHint}</p>
      </div>

      {layoutMode === 'paper' && (
        <div className="advanced-grid">
          <label className="control-field">
            <span>{copy.composition.pageSize}</span>
            <select value={pagePreset} onChange={(event) => onOptionChange('pagePreset', event.target.value)}>
              {Object.entries(PAGE_SIZES).map(([value, page]) => (
                <option value={value} key={value}>
                  {page.label}
                </option>
              ))}
            </select>
          </label>

          <label className="control-field">
            <span>{copy.composition.orientation}</span>
            <select value={orientation} onChange={(event) => onOptionChange('orientation', event.target.value)}>
              <option value="portrait">{copy.composition.portrait}</option>
              <option value="landscape">{copy.composition.landscape}</option>
            </select>
          </label>

          <label className="control-field">
            <span>{copy.composition.margin(margin)}</span>
            <input type="range" min="0" max="96" step="6" value={margin} onChange={(event) => onOptionChange('margin', Number(event.target.value))} />
          </label>

          <label className="control-field">
            <span>{copy.composition.gap(gap)}</span>
            <input type="range" min="0" max="72" step="6" value={gap} onChange={(event) => onOptionChange('gap', Number(event.target.value))} />
          </label>
        </div>
      )}
    </div>
  );
}
