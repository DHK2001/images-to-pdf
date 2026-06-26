import React from 'react';
import { Loader2 } from 'lucide-react';
import { copy } from '../lib/copy.js';

export function BusyOverlay({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="busy-backdrop" role="status" aria-live="polite" aria-busy="true">
      <div className="busy-card">
        <Loader2 className="spin" size={34} />
        <strong>{copy.loading.title}</strong>
        <span>{message || copy.loading.message}</span>
      </div>
    </div>
  );
}
