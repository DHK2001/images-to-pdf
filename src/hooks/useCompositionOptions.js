import { useMemo, useState } from 'react';
import { DEFAULT_OPTIONS } from '../lib/constants.js';
import { pageDimensions } from '../lib/layout.js';

export function useCompositionOptions() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const updateOption = (name, value) => {
    setOptions((currentOptions) => ({
      ...currentOptions,
      [name]: value,
    }));
  };

  const derivedOptions = useMemo(() => {
    const pageMargin = options.layoutMode === 'paper' ? options.margin : 0;
    const pageGap = options.layoutMode === 'paper' ? options.gap : 0;

    return {
      imageGrid: {
        cols: options.gridColumns,
        rows: options.gridRows,
      },
      pageGap,
      pageMargin,
      previewPaper: pageDimensions(options.pagePreset, options.orientation),
    };
  }, [options]);

  return {
    options,
    updateOption,
    ...derivedOptions,
  };
}
