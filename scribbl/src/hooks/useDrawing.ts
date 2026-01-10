'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ScribblElement, AppState } from '@/types';
import { DEFAULT_APP_STATE } from '@/types';
import {
  Drawing,
  getDrawing,
  updateDrawing,
  generateThumbnailFromElements,
} from '@/lib/supabase/drawings';
import { renderScene } from '@/lib/canvas/renderer';

interface UseDrawingOptions {
  drawingId: string;
  autoSaveInterval?: number; // in milliseconds
}

interface UseDrawingReturn {
  drawing: Drawing | null;
  elements: ScribblElement[];
  setElements: React.Dispatch<React.SetStateAction<ScribblElement[]>>;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  save: () => Promise<boolean>;
  updateName: (name: string) => Promise<boolean>;
}

export function useDrawing({
  drawingId,
  autoSaveInterval = 3000,
}: UseDrawingOptions): UseDrawingReturn {
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [elements, setElements] = useState<ScribblElement[]>([]);
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track if there are unsaved changes
  const hasChanges = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load drawing on mount
  useEffect(() => {
    async function loadDrawing() {
      setLoading(true);
      setError(null);

      const data = await getDrawing(drawingId);
      if (data) {
        setDrawing(data);
        setElements(data.elements || []);
        setAppState(prev => ({
          ...prev,
          ...(data.app_state || {}),
        }));
      } else {
        setError('Drawing not found');
      }

      setLoading(false);
    }

    loadDrawing();
  }, [drawingId]);


  // Mark as having changes when elements change
  useEffect(() => {
    if (!loading && drawing) {
      hasChanges.current = true;
    }
  }, [elements, loading, drawing]);

  // Auto-save functionality
  useEffect(() => {
    if (!drawing || loading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set up new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      if (hasChanges.current) {
        await performSave();
      }
    }, autoSaveInterval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, drawing, loading, autoSaveInterval]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const performSave = useCallback(async (): Promise<boolean> => {
    if (!drawing || saving) return false;

    setSaving(true);

    // Generate thumbnail from elements
    let thumbnail: string | undefined;
    if (elements.length > 0) {
      thumbnail = generateThumbnailFromElements(elements, renderScene);
    }

    const success = await updateDrawing(drawing.id, {
      elements,
      app_state: {
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      },
      thumbnail,
    });

    if (success) {
      hasChanges.current = false;
      setLastSaved(new Date());
    }

    setSaving(false);
    return success;
  }, [drawing, elements, appState, saving]);

  const updateName = useCallback(async (name: string): Promise<boolean> => {
    if (!drawing) return false;

    const success = await updateDrawing(drawing.id, { name });
    if (success) {
      setDrawing(prev => prev ? { ...prev, name } : null);
    }
    return success;
  }, [drawing]);

  return {
    drawing,
    elements,
    setElements,
    appState,
    setAppState,
    loading,
    saving,
    lastSaved,
    error,
    save: performSave,
    updateName,
  };
}
