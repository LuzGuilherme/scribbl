'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ScribblElement, AppState } from '@/types';
import { DEFAULT_APP_STATE } from '@/types';
import { getPublicDrawing, Drawing } from '@/lib/supabase/drawings';
import { renderScene } from '@/lib/canvas/renderer';

export default function PublicViewPage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [elements, setElements] = useState<ScribblElement[]>([]);
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load public drawing
  useEffect(() => {
    async function loadDrawing() {
      setLoading(true);
      setError(null);

      const data = await getPublicDrawing(publicId);
      if (data) {
        setDrawing(data);
        setElements(data.elements || []);
        setAppState(prev => ({
          ...prev,
          ...(data.app_state || {}),
        }));
      } else {
        setError('Drawing not found or is not public');
      }

      setLoading(false);
    }

    loadDrawing();
  }, [publicId]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Render
    renderScene(canvas, elements, appState, {}, []);
  }, [elements, appState]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderScene(canvas, elements, appState, {}, []);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [elements, appState]);

  // Pan and zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setAppState(prev => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom * delta, 0.1), 5),
      }));
    } else {
      // Pan
      setAppState(prev => ({
        ...prev,
        scrollX: prev.scrollX - e.deltaX,
        scrollY: prev.scrollY - e.deltaY,
      }));
    }
  }, []);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+click to pan
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setAppState(prev => ({
        ...prev,
        scrollX: prev.scrollX + dx,
        scrollY: prev.scrollY + dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoom = (delta: number) => {
    setAppState(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + delta, 0.1), 5),
    }));
  };

  const handleResetView = () => {
    setAppState(prev => ({
      ...prev,
      zoom: 1,
      scrollX: 0,
      scrollY: 0,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading drawing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-red-500 mb-4">{error}</div>
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-700"
        >
          Go to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Scribbl
              </span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-medium text-gray-900">
              {drawing?.name || 'Untitled'}
            </h1>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              View Only
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create your own
            </Link>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0"
        />

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 min-w-[4rem] text-center">
            {Math.round(appState.zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-gray-100 rounded text-sm text-gray-600"
            title="Reset view"
          >
            Reset
          </button>
        </div>

        {/* Help text */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Scroll to pan | Ctrl+scroll to zoom | Alt+drag to pan
        </div>
      </div>
    </div>
  );
}
