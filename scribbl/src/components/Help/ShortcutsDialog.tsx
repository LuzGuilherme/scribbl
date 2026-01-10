'use client';

import React from 'react';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: 'Tools',
    items: [
      { keys: ['V'], description: 'Selection tool' },
      { keys: ['H'], description: 'Pan tool (Hand)' },
      { keys: ['R'], description: 'Rectangle' },
      { keys: ['O'], description: 'Ellipse (Oval)' },
      { keys: ['D'], description: 'Diamond' },
      { keys: ['L'], description: 'Line' },
      { keys: ['A'], description: 'Arrow' },
      { keys: ['P'], description: 'Pencil (Freedraw)' },
      { keys: ['T'], description: 'Text' },
    ],
  },
  {
    category: 'Canvas',
    items: [
      { keys: ['Space'], description: 'Hold to pan' },
      { keys: ['Scroll'], description: 'Pan canvas' },
      { keys: ['Ctrl', 'Scroll'], description: 'Zoom in/out' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' },
    ],
  },
  {
    category: 'Edit',
    items: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selection' },
      { keys: ['Ctrl', 'C'], description: 'Copy elements' },
      { keys: ['Ctrl', 'V'], description: 'Paste elements' },
      { keys: ['Delete'], description: 'Delete selection' },
      { keys: ['Backspace'], description: 'Delete selection' },
      { keys: ['Escape'], description: 'Deselect / Cancel' },
    ],
  },
  {
    category: 'Group',
    items: [
      { keys: ['Ctrl', 'G'], description: 'Group elements' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup elements' },
    ],
  },
  {
    category: 'File',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Save' },
    ],
  },
];

export default function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {SHORTCUTS.map((section) => (
              <div key={section.category}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{section.category}</h4>
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {keyIdx > 0 && <span className="text-gray-400 text-xs">+</span>}
                            <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">?</kbd> to toggle this dialog
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
