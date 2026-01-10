'use client';

import React from 'react';
import type { Tool, AppState } from '@/types';
import { COLORS } from '@/types';

interface ToolbarProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onImageUpload?: (file: File) => void;
}

interface ToolButtonProps {
  tool: Tool;
  currentTool: Tool;
  onClick: () => void;
  icon: React.ReactNode;
  shortcut: string;
  label: string;
}

function ToolButton({ tool, currentTool, onClick, icon, shortcut, label }: ToolButtonProps) {
  const isActive = tool === currentTool;
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-lg
        transition-all duration-150
        ${isActive
          ? 'bg-indigo-100 text-indigo-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
      title={`${label} (${shortcut})`}
    >
      {icon}
      <span className="absolute bottom-0.5 right-1 text-[9px] text-gray-400 font-medium">
        {shortcut}
      </span>
    </button>
  );
}

export default function Toolbar({
  appState,
  setAppState,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onImageUpload,
}: ToolbarProps) {
  const setTool = (tool: Tool) => {
    setAppState(prev => ({ ...prev, tool }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const tools: { tool: Tool; icon: React.ReactNode; shortcut: string; label: string }[] = [
    {
      tool: 'selection',
      shortcut: 'V',
      label: 'Selection',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      ),
    },
    {
      tool: 'pan',
      shortcut: 'H',
      label: 'Pan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      ),
    },
    {
      tool: 'rectangle',
      shortcut: 'R',
      label: 'Rectangle',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      tool: 'ellipse',
      shortcut: 'O',
      label: 'Ellipse',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="9" ry="9" />
        </svg>
      ),
    },
    {
      tool: 'diamond',
      shortcut: 'D',
      label: 'Diamond',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L22 12L12 22L2 12L12 2Z" />
        </svg>
      ),
    },
    {
      tool: 'line',
      shortcut: 'L',
      label: 'Line',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="20" x2="20" y2="4" />
        </svg>
      ),
    },
    {
      tool: 'arrow',
      shortcut: 'A',
      label: 'Arrow',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="19" x2="19" y2="5" />
          <polyline points="12 5 19 5 19 12" />
        </svg>
      ),
    },
    {
      tool: 'freedraw',
      shortcut: 'P',
      label: 'Pencil',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      ),
    },
    {
      tool: 'text',
      shortcut: 'T',
      label: 'Text',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7V4h16v3" />
          <path d="M9 20h6" />
          <path d="M12 4v16" />
        </svg>
      ),
    },
  ];

  const colorOptions = Object.entries(COLORS).filter(([name]) => name !== 'transparent');

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5">
        {/* Logo */}
        <div className="flex items-center px-3 border-r border-gray-200 mr-1">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Scribbl
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          {tools.map(({ tool, icon, shortcut, label }) => (
            <ToolButton
              key={tool}
              tool={tool}
              currentTool={appState.tool}
              onClick={() => setTool(tool)}
              icon={icon}
              shortcut={shortcut}
              label={label}
            />
          ))}

          {/* Image upload */}
          {onImageUpload && (
            <label
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              title="Insert image (I)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="absolute bottom-0.5 right-1 text-[9px] text-gray-400 font-medium">
                I
              </span>
            </label>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg
              ${canUndo
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 cursor-not-allowed'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg
              ${canRedo
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 cursor-not-allowed'
              }
            `}
            title="Redo (Ctrl+Y)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Color picker */}
        <div className="flex items-center gap-1 px-2">
          <div className="relative">
            <button
              className="w-8 h-8 rounded-lg border-2 border-gray-300 overflow-hidden"
              style={{ backgroundColor: appState.currentColor }}
              title="Stroke Color"
            />
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block">
              {/* Color picker dropdown would go here */}
            </div>
          </div>
          <div className="flex flex-wrap gap-0.5 max-w-[100px]">
            {colorOptions.slice(0, 6).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setAppState(prev => ({ ...prev, currentColor: color }))}
                className={`w-5 h-5 rounded border ${
                  appState.currentColor === color ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center justify-center px-3 h-10 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          title="Export as PNG"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="ml-1.5 text-sm font-medium">Export</span>
        </button>
      </div>
    </div>
  );
}
