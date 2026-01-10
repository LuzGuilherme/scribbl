'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ScribblElement, AppState } from '@/types';
import { renderScene } from '@/lib/canvas/renderer';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScribblElement[];
  appState: AppState;
  drawingName: string;
}

export default function ExportDialog({
  isOpen,
  onClose,
  elements,
  appState,
  drawingName,
}: ExportDialogProps) {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [padding, setPadding] = useState(20);
  const [scale, setScale] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const visibleElements = elements.filter(el => !el.isDeleted);

  // Generate preview
  useEffect(() => {
    if (!isOpen || visibleElements.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visibleElements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const width = (maxX - minX + padding * 2) * scale;
    const height = (maxY - minY + padding * 2) * scale;

    canvas.width = width;
    canvas.height = height;

    // Fill background
    if (!transparentBg) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Render elements using the canvas renderer
    renderScene(canvas, visibleElements, {
      ...appState,
      zoom: scale,
      scrollX: (-minX + padding) * scale,
      scrollY: (-minY + padding) * scale,
      selectedElementIds: {},
    }, {}, [], null);

    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [isOpen, visibleElements, backgroundColor, transparentBg, padding, scale, appState]);

  const handleExport = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.download = `${drawingName || 'scribbl'}-${Date.now()}.png`;
    link.href = previewUrl;
    link.click();
    onClose();
  };

  const handleCopyToClipboard = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      onClose();
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Export Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {visibleElements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nothing to export. Add some elements first!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div
                  className="border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-4"
                  style={{ backgroundColor: transparentBg ? '#f3f4f6' : backgroundColor }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Export preview"
                      className="max-w-full max-h-64 object-contain"
                      style={{
                        backgroundImage: transparentBg ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E")' : 'none'
                      }}
                    />
                  ) : (
                    <div className="text-gray-400">Generating preview...</div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Options</h4>

                {/* Background */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Transparent background</span>
                  </label>
                  {!transparentBg && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Background color:</span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Padding */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Padding: {padding}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Scale: {scale}x
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        className={`px-3 py-1 text-sm rounded ${
                          scale === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {visibleElements.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Copy to clipboard
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Download PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
