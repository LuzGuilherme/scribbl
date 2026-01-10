'use client';

import React from 'react';
import type { ScribblElement, AppState } from '@/types';
import { COLORS } from '@/types';

interface PropertiesPanelProps {
  selectedElements: ScribblElement[];
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onUpdateElements: (updates: Partial<ScribblElement>) => void;
  onDeleteElements: () => void;
  onDuplicateElements: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
}

export default function PropertiesPanel({
  selectedElements,
  appState,
  setAppState,
  onUpdateElements,
  onDeleteElements,
  onDuplicateElements,
  onBringToFront,
  onSendToBack,
  onGroup,
  onUngroup,
}: PropertiesPanelProps) {
  if (selectedElements.length === 0) {
    return null;
  }

  const element = selectedElements[0];
  const colorOptions = Object.entries(COLORS);
  const canGroup = selectedElements.length >= 2;
  const canUngroup = selectedElements.some(el => el.groupId !== null);

  const strokeWidths = [1, 2, 4, 6];
  const fillStyles = [
    { value: 'hachure', label: 'Hachure' },
    { value: 'solid', label: 'Solid' },
    { value: 'cross-hatch', label: 'Cross-hatch' },
  ];

  return (
    <div className="fixed right-4 top-20 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-40">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Properties {selectedElements.length > 1 && `(${selectedElements.length} selected)`}
      </h3>

      {/* Stroke Color */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Stroke Color
        </label>
        <div className="flex flex-wrap gap-1">
          {colorOptions.filter(([name]) => name !== 'transparent').map(([name, color]) => (
            <button
              key={name}
              onClick={() => onUpdateElements({ strokeColor: color })}
              className={`w-6 h-6 rounded border-2 transition-all ${
                element.strokeColor === color
                  ? 'border-indigo-500 scale-110'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Background
        </label>
        <div className="flex flex-wrap gap-1">
          {colorOptions.map(([name, color]) => (
            <button
              key={name}
              onClick={() => onUpdateElements({ backgroundColor: color })}
              className={`w-6 h-6 rounded border-2 transition-all ${
                element.backgroundColor === color
                  ? 'border-indigo-500 scale-110'
                  : 'border-gray-200 hover:border-gray-400'
              } ${name === 'transparent' ? 'bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC")] bg-repeat' : ''}`}
              style={{ backgroundColor: name !== 'transparent' ? color : undefined }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Stroke Width
        </label>
        <div className="flex gap-2">
          {strokeWidths.map(width => (
            <button
              key={width}
              onClick={() => onUpdateElements({ strokeWidth: width })}
              className={`flex-1 h-8 rounded border-2 flex items-center justify-center transition-all ${
                element.strokeWidth === width
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div
                className="rounded-full bg-gray-800"
                style={{ width: width * 3, height: width * 3 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Fill Style */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Fill Style
        </label>
        <div className="flex gap-1">
          {fillStyles.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdateElements({ fillStyle: value as any })}
              className={`flex-1 px-2 py-1.5 text-xs rounded border-2 transition-all ${
                element.fillStyle === value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-400 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Opacity: {element.opacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={element.opacity}
          onChange={e => onUpdateElements({ opacity: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Actions */}
      <div className="space-y-2">
        {/* Layer controls */}
        <div className="flex gap-2">
          <button
            onClick={onBringToFront}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Bring to Front
          </button>
          <button
            onClick={onSendToBack}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Send to Back
          </button>
        </div>

        {/* Group controls */}
        {(canGroup || canUngroup) && (
          <div className="flex gap-2">
            {canGroup && onGroup && (
              <button
                onClick={onGroup}
                className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Group (Ctrl+G)
              </button>
            )}
            {canUngroup && onUngroup && (
              <button
                onClick={onUngroup}
                className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Ungroup
              </button>
            )}
          </div>
        )}

        {/* Duplicate/Delete */}
        <div className="flex gap-2">
          <button
            onClick={onDuplicateElements}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={onDeleteElements}
            className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
