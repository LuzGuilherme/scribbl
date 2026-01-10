'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDrawing } from '@/hooks/useDrawing';
import type { ScribblElement, Tool } from '@/types';
import Toolbar from '@/components/Toolbar/Toolbar';
import PropertiesPanel from '@/components/Sidebar/PropertiesPanel';
import ZoomControls from '@/components/ZoomControls/ZoomControls';
import LibraryPanel from '@/components/Library/LibraryPanel';
import ExportDialog from '@/components/Export/ExportDialog';
import ShortcutsDialog from '@/components/Help/ShortcutsDialog';
import { History } from '@/lib/canvas/history';
import { duplicateElement, deleteElement, groupElements, ungroupElements } from '@/lib/canvas/elements';
import { makeDrawingPublic, makeDrawingPrivate } from '@/lib/supabase/drawings';
import { clearBindingsForDeletedElement } from '@/lib/canvas/bindings';
import { nanoid } from 'nanoid';

const Canvas = dynamic(() => import('@/components/Canvas/Canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">Loading canvas...</div>
    </div>
  ),
});

export default function DrawPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const drawingId = params.id as string;
  const historyRef = useRef(new History());

  const {
    drawing,
    elements,
    setElements,
    appState,
    setAppState,
    loading,
    saving,
    lastSaved,
    error,
    save,
    updateName,
  } = useDrawing({ drawingId, autoSaveInterval: 3000 });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const clipboardRef = useRef<ScribblElement[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/draw/${drawingId}`);
    }
  }, [user, authLoading, router, drawingId]);

  // Update share state when drawing loads
  useEffect(() => {
    if (drawing) {
      setIsPublic(drawing.is_public);
      if (drawing.is_public && drawing.public_id) {
        setShareUrl(`${window.location.origin}/view/${drawing.public_id}`);
      }
    }
  }, [drawing]);

  // Get selected elements
  const selectedElements = elements.filter(
    el => appState.selectedElementIds[el.id] && !el.isDeleted
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const toolShortcuts: Record<string, Tool> = {
        v: 'selection',
        h: 'pan',
        r: 'rectangle',
        o: 'ellipse',
        d: 'diamond',
        l: 'line',
        a: 'arrow',
        p: 'freedraw',
        t: 'text',
      };

      const key = e.key.toLowerCase();

      if (!e.ctrlKey && !e.metaKey && toolShortcuts[key]) {
        e.preventDefault();
        setAppState(prev => ({ ...prev, tool: toolShortcuts[key] }));
        return;
      }

      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        save();
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          handleDeleteElements();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'd') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          handleDuplicateElements();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'g' && !e.shiftKey) {
        if (selectedElements.length >= 2) {
          e.preventDefault();
          handleGroup();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'g' && e.shiftKey) {
        e.preventDefault();
        handleUngroup();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === 'a') {
        e.preventDefault();
        const newSelectedIds: Record<string, boolean> = {};
        elements.forEach(el => {
          if (!el.isDeleted) newSelectedIds[el.id] = true;
        });
        setAppState(prev => ({ ...prev, selectedElementIds: newSelectedIds }));
        return;
      }

      if (key === 'escape') {
        setAppState(prev => ({
          ...prev,
          selectedElementIds: {},
          tool: 'selection',
        }));
        return;
      }

      if (key === ' ' && !e.repeat) {
        e.preventDefault();
        setAppState(prev => ({ ...prev, tool: 'pan' }));
        return;
      }

      // Copy: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && key === 'c') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          handleCopy();
        }
        return;
      }

      // Paste: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Show shortcuts: ?
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setAppState(prev => ({ ...prev, tool: 'selection' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [elements, selectedElements, setAppState, save]);

  const handleUndo = useCallback(() => {
    const previousState = historyRef.current.undo(elements);
    if (previousState) setElements(previousState);
  }, [elements, setElements]);

  const handleRedo = useCallback(() => {
    const nextState = historyRef.current.redo(elements);
    if (nextState) setElements(nextState);
  }, [elements, setElements]);

  const handleExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleCopy = useCallback(() => {
    if (selectedElements.length === 0) return;

    // Store elements in clipboard ref
    clipboardRef.current = selectedElements.map(el => ({ ...el }));

    // Also try to copy to system clipboard as JSON
    try {
      const data = JSON.stringify({
        type: 'scribbl-elements',
        elements: selectedElements,
      });
      navigator.clipboard.writeText(data);
    } catch (err) {
      console.log('Could not copy to system clipboard');
    }
  }, [selectedElements]);

  const handlePaste = useCallback(async () => {
    // First try to get from system clipboard
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);

      if (data.type === 'scribbl-elements' && Array.isArray(data.elements)) {
        // Paste from system clipboard
        pasteElements(data.elements);
        return;
      }
    } catch (err) {
      // Not JSON or not scribbl data, continue
    }

    // Fall back to internal clipboard
    if (clipboardRef.current.length > 0) {
      pasteElements(clipboardRef.current);
    }
  }, []);

  const pasteElements = useCallback((elementsToPaste: ScribblElement[]) => {
    historyRef.current.push(elements);

    // Calculate offset for pasting
    const offset = 20;

    const newElements = elementsToPaste.map(el => ({
      ...el,
      id: nanoid(),
      x: el.x + offset,
      y: el.y + offset,
    }));

    setElements(prev => [...prev, ...newElements]);

    // Select pasted elements
    const newSelectedIds: Record<string, boolean> = {};
    newElements.forEach(el => {
      newSelectedIds[el.id] = true;
    });
    setAppState(prev => ({ ...prev, selectedElementIds: newSelectedIds }));
  }, [elements, setElements, setAppState]);

  const handleUpdateElements = useCallback(
    (updates: Partial<ScribblElement>) => {
      historyRef.current.push(elements);
      setElements(prev =>
        prev.map(el =>
          appState.selectedElementIds[el.id] ? { ...el, ...updates } : el
        )
      );
    },
    [elements, appState.selectedElementIds, setElements]
  );

  const handleDeleteElements = useCallback(() => {
    historyRef.current.push(elements);

    // Get IDs of elements being deleted
    const deletedIds = Object.keys(appState.selectedElementIds);

    setElements(prev => {
      // First mark elements as deleted
      let updatedElements = prev.map(el =>
        appState.selectedElementIds[el.id] ? deleteElement(el) : el
      );

      // Clear bindings from arrows that were connected to deleted elements
      for (const deletedId of deletedIds) {
        updatedElements = clearBindingsForDeletedElement(updatedElements, deletedId);
      }

      return updatedElements;
    });
    setAppState(prev => ({ ...prev, selectedElementIds: {} }));
  }, [elements, appState.selectedElementIds, setElements, setAppState]);

  const handleDuplicateElements = useCallback(() => {
    historyRef.current.push(elements);
    const newElements: ScribblElement[] = [];
    const newSelectedIds: Record<string, boolean> = {};

    selectedElements.forEach(el => {
      const duplicate = duplicateElement(el);
      newElements.push(duplicate);
      newSelectedIds[duplicate.id] = true;
    });

    setElements(prev => [...prev, ...newElements]);
    setAppState(prev => ({ ...prev, selectedElementIds: newSelectedIds }));
  }, [elements, selectedElements, setElements, setAppState]);

  const handleBringToFront = useCallback(() => {
    historyRef.current.push(elements);
    const selected = elements.filter(el => appState.selectedElementIds[el.id]);
    const rest = elements.filter(el => !appState.selectedElementIds[el.id]);
    setElements([...rest, ...selected]);
  }, [elements, appState.selectedElementIds, setElements]);

  const handleSendToBack = useCallback(() => {
    historyRef.current.push(elements);
    const selected = elements.filter(el => appState.selectedElementIds[el.id]);
    const rest = elements.filter(el => !appState.selectedElementIds[el.id]);
    setElements([...selected, ...rest]);
  }, [elements, appState.selectedElementIds, setElements]);

  const handleGroup = useCallback(() => {
    if (selectedElements.length < 2) return;
    historyRef.current.push(elements);
    const groupId = nanoid();
    const grouped = groupElements(selectedElements, groupId);

    setElements(prev =>
      prev.map(el => {
        const g = grouped.find(ge => ge.id === el.id);
        return g || el;
      })
    );
  }, [elements, selectedElements, setElements]);

  const handleUngroup = useCallback(() => {
    const toUngroup = selectedElements.filter(el => el.groupId !== null);
    if (toUngroup.length === 0) return;

    historyRef.current.push(elements);
    const ungrouped = ungroupElements(toUngroup);

    setElements(prev =>
      prev.map(el => {
        const u = ungrouped.find(ue => ue.id === el.id);
        return u || el;
      })
    );
  }, [elements, selectedElements, setElements]);

  const handleNameEdit = async () => {
    if (editedName && editedName !== drawing?.name) {
      await updateName(editedName);
    }
    setIsEditingName(false);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleMakePublic = async () => {
    if (!drawing) return;
    const publicId = await makeDrawingPublic(drawing.id);
    if (publicId) {
      const url = `${window.location.origin}/view/${publicId}`;
      setShareUrl(url);
      setIsPublic(true);
    }
  };

  const handleMakePrivate = async () => {
    if (!drawing) return;
    const success = await makeDrawingPrivate(drawing.id);
    if (success) {
      setShareUrl(null);
      setIsPublic(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleInsertFromLibrary = useCallback((libraryElements: ScribblElement[]) => {
    historyRef.current.push(elements);

    // Position elements in center of visible canvas area
    const centerX = (-appState.scrollX + window.innerWidth / 2) / appState.zoom;
    const centerY = (-appState.scrollY + window.innerHeight / 2) / appState.zoom;

    const newElements = libraryElements.map(el => ({
      ...el,
      x: el.x + centerX - 50,
      y: el.y + centerY - 50,
    }));

    setElements(prev => [...prev, ...newElements]);

    // Select the inserted elements
    const newSelectedIds: Record<string, boolean> = {};
    newElements.forEach(el => {
      newSelectedIds[el.id] = true;
    });
    setAppState(prev => ({ ...prev, selectedElementIds: newSelectedIds, tool: 'selection' }));
  }, [elements, appState, setElements, setAppState]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Position in center of visible canvas
        const centerX = (-appState.scrollX + window.innerWidth / 2) / appState.zoom;
        const centerY = (-appState.scrollY + window.innerHeight / 2) / appState.zoom;

        // Scale down large images
        let width = img.width;
        let height = img.height;
        const maxSize = 400;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width *= scale;
          height *= scale;
        }

        const newElement: ScribblElement = {
          id: nanoid(),
          type: 'image',
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          strokeColor: '#1e1e1e',
          backgroundColor: 'transparent',
          fillStyle: 'solid',
          strokeWidth: 2,
          roughness: 1,
          opacity: 100,
          angle: 0,
          groupId: null,
          isDeleted: false,
          seed: Math.floor(Math.random() * 2000000000),
          fileId: dataUrl,
          scale: [1, 1],
        };

        historyRef.current.push(elements);
        setElements(prev => [...prev, newElement]);
        setAppState(prev => ({
          ...prev,
          selectedElementIds: { [newElement.id]: true },
          tool: 'selection',
        }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [elements, appState, setElements, setAppState]);

  if (loading || authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading drawing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-red-500 mb-4">{error}</div>
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-white">
      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        {/* Drawing name */}
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameEdit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
            className="text-lg font-medium px-2 py-1 border border-indigo-500 rounded outline-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditedName(drawing?.name || '');
              setIsEditingName(true);
            }}
            className="text-lg font-medium text-gray-900 hover:text-indigo-600"
          >
            {drawing?.name}
          </button>
        )}

        {/* Save status */}
        <div className="ml-4 text-sm text-gray-500">
          {saving ? (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved</span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={handleShare}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
              isPublic
                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {isPublic ? 'Shared' : 'Share'}
          </button>

          {/* Library button */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
              showLibrary
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Library
          </button>

          {/* Manual save */}
          <button
            onClick={save}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Share Drawing</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {isPublic ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">This drawing is public</p>
                      <p className="text-sm text-gray-500">Anyone with the link can view it</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Share link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                      >
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleMakePrivate}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Make private
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">This drawing is private</p>
                      <p className="text-sm text-gray-500">Only you can see it</p>
                    </div>
                  </div>

                  <button
                    onClick={handleMakePublic}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Create public link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar - adjusted position */}
      <div className="pt-14">
        <Toolbar
          appState={appState}
          setAppState={setAppState}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyRef.current.canUndo()}
          canRedo={historyRef.current.canRedo()}
          onExport={handleExport}
          onImageUpload={handleImageUpload}
        />
      </div>

      <div className="absolute top-14 left-0 right-0 bottom-0">
        <Canvas
          elements={elements}
          setElements={setElements}
          appState={appState}
          setAppState={setAppState}
          history={historyRef.current}
        />
      </div>

      <PropertiesPanel
        selectedElements={selectedElements}
        appState={appState}
        setAppState={setAppState}
        onUpdateElements={handleUpdateElements}
        onDeleteElements={handleDeleteElements}
        onDuplicateElements={handleDuplicateElements}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
      />

      <ZoomControls appState={appState} setAppState={setAppState} />

      <LibraryPanel
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        selectedElements={selectedElements}
        onInsertElements={handleInsertFromLibrary}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        elements={elements}
        appState={appState}
        drawingName={drawing?.name || 'Untitled'}
      />

      <ShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Help button */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium z-40"
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>
    </main>
  );
}
