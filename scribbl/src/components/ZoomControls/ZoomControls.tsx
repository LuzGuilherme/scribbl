'use client';

import React from 'react';
import type { AppState } from '@/types';

interface ZoomControlsProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

export default function ZoomControls({ appState, setAppState }: ZoomControlsProps) {
  const zoomIn = () => {
    setAppState(prev => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.2),
    }));
  };

  const zoomOut = () => {
    setAppState(prev => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2),
    }));
  };

  const resetZoom = () => {
    setAppState(prev => ({
      ...prev,
      zoom: 1,
      scrollX: 0,
      scrollY: 0,
    }));
  };

  const zoomPercent = Math.round(appState.zoom * 100);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          onClick={resetZoom}
          className="px-2 h-8 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors min-w-[50px]"
          title="Reset Zoom"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
