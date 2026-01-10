'use client';

import React, { useState, useEffect } from 'react';
import type { ScribblElement } from '@/types';
import {
  Library,
  getUserLibraries,
  createLibraryItem,
  deleteLibraryItem,
} from '@/lib/supabase/drawings';
import { nanoid } from 'nanoid';

// Pre-built library items
const PRESET_LIBRARIES: Omit<Library, 'id' | 'user_id' | 'created_at'>[] = [
  {
    name: 'Basic Flowchart',
    is_preset: true,
    elements: [
      {
        id: 'preset-rect',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 120,
        height: 60,
        strokeColor: '#1e1e1e',
        backgroundColor: '#a5d8ff',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
      },
      {
        id: 'preset-diamond',
        type: 'diamond',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        strokeColor: '#1e1e1e',
        backgroundColor: '#ffec99',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
      },
      {
        id: 'preset-ellipse',
        type: 'ellipse',
        x: 0,
        y: 0,
        width: 120,
        height: 60,
        strokeColor: '#1e1e1e',
        backgroundColor: '#b2f2bb',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
      },
    ] as ScribblElement[],
  },
  {
    name: 'Arrows',
    is_preset: true,
    elements: [
      {
        id: 'preset-arrow-right',
        type: 'arrow',
        x: 0,
        y: 0,
        width: 100,
        height: 0,
        strokeColor: '#1e1e1e',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      },
      {
        id: 'preset-arrow-down',
        type: 'arrow',
        x: 0,
        y: 0,
        width: 0,
        height: 100,
        strokeColor: '#1e1e1e',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
        points: [{ x: 0, y: 0 }, { x: 0, y: 100 }],
      },
    ] as ScribblElement[],
  },
  {
    name: 'UML Class',
    is_preset: true,
    elements: [
      {
        id: 'preset-class-box',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 150,
        height: 120,
        strokeColor: '#1e1e1e',
        backgroundColor: '#fff9db',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        angle: 0,
        groupId: null,
        isDeleted: false,
      },
    ] as ScribblElement[],
  },
];

interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElements: ScribblElement[];
  onInsertElements: (elements: ScribblElement[]) => void;
}

export default function LibraryPanel({
  isOpen,
  onClose,
  selectedElements,
  onInsertElements,
}: LibraryPanelProps) {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLibraries();
    }
  }, [isOpen]);

  const loadLibraries = async () => {
    setLoading(true);
    const data = await getUserLibraries();
    setLibraries(data);
    setLoading(false);
  };

  const handleSaveToLibrary = async () => {
    if (!savingName.trim() || selectedElements.length === 0) return;

    // Normalize positions relative to first element
    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));

    const normalizedElements = selectedElements.map(el => ({
      ...el,
      id: nanoid(), // New ID for library
      x: el.x - minX,
      y: el.y - minY,
    }));

    const library = await createLibraryItem(savingName.trim(), normalizedElements);
    if (library) {
      setLibraries(prev => [library, ...prev]);
      setSavingName('');
      setShowSaveDialog(false);
    }
  };

  const handleInsert = (libraryElements: ScribblElement[]) => {
    // Create new elements with unique IDs
    const newElements = libraryElements.map(el => ({
      ...el,
      id: nanoid(),
    }));
    onInsertElements(newElements);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this library item?')) {
      const success = await deleteLibraryItem(id);
      if (success) {
        setLibraries(prev => prev.filter(l => l.id !== id));
      }
    }
  };

  // Combine preset and user libraries
  const allLibraries = [
    ...PRESET_LIBRARIES.map((p, i) => ({ ...p, id: `preset-${i}`, user_id: '', created_at: '' })),
    ...libraries,
  ];

  const userLibraries = allLibraries.filter(l => !l.is_preset);
  const presetLibraries = allLibraries.filter(l => l.is_preset);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-0 w-72 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Library</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Save to library button */}
      {selectedElements.length > 0 && (
        <div className="p-3 border-b border-gray-200">
          {showSaveDialog ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Library name..."
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveToLibrary()}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={handleSaveToLibrary}
                disabled={!savingName.trim()}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-2 py-1.5 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Save selection to library
            </button>
          )}
        </div>
      )}

      {/* Library content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* User libraries */}
            {userLibraries.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  My Library
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {userLibraries.map((library) => (
                    <div
                      key={library.id}
                      className="group relative bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      onClick={() => handleInsert(library.elements)}
                    >
                      <div className="aspect-square bg-white rounded border border-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                        <div className="text-2xl text-gray-300">
                          {library.elements.length > 1 ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 truncate text-center">{library.name}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(library.id);
                        }}
                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preset libraries */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Shape Libraries
              </h4>
              <div className="space-y-2">
                {presetLibraries.map((library) => (
                  <div key={library.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">{library.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {library.elements.map((element, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleInsert([element])}
                          className="w-12 h-12 bg-white border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-colors"
                          title={`Insert ${element.type}`}
                        >
                          {element.type === 'rectangle' && (
                            <div className="w-6 h-4 border-2 border-gray-600 rounded-sm" style={{ backgroundColor: element.backgroundColor }} />
                          )}
                          {element.type === 'ellipse' && (
                            <div className="w-6 h-4 border-2 border-gray-600 rounded-full" style={{ backgroundColor: element.backgroundColor }} />
                          )}
                          {element.type === 'diamond' && (
                            <div className="w-5 h-5 border-2 border-gray-600 transform rotate-45" style={{ backgroundColor: element.backgroundColor }} />
                          )}
                          {element.type === 'arrow' && (
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          )}
                          {element.type === 'line' && (
                            <div className="w-6 h-0.5 bg-gray-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {userLibraries.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                <p>Select elements and save them</p>
                <p>to your library for reuse</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
