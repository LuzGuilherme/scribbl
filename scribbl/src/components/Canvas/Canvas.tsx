'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ScribblElement, AppState, Tool, Point } from '@/types';
import {
  renderScene,
  getSceneCoordinates,
  getElementAtPosition,
  getResizeHandle,
  getViewportCoordinates,
  wrapText,
} from '@/lib/canvas/renderer';
import {
  createElement,
  updateElement,
  moveElement,
  resizeElement,
  rotateElement,
  addPointToLine,
  updateLineBounds,
} from '@/lib/canvas/elements';
import {
  getAlignmentGuides,
  findNearestSnapPoint,
  AlignmentGuide,
} from '@/lib/canvas/snapping';
import { History } from '@/lib/canvas/history';
import {
  findBindingTarget,
  updateBoundArrows,
  clearArrowBindings,
} from '@/lib/canvas/bindings';
import type { LineElement, ArrowElement } from '@/types';

interface CanvasProps {
  elements: ScribblElement[];
  setElements: React.Dispatch<React.SetStateAction<ScribblElement[]>>;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  history: History;
}

interface TextEditingState {
  isEditing: boolean;
  x: number; // Scene coordinates
  y: number; // Scene coordinates
  text: string;
  elementId: string | null; // ID of element being edited, null for new text
}

export default function Canvas({
  elements,
  setElements,
  appState,
  setAppState,
  history,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const [textEditing, setTextEditing] = useState<TextEditingState>({
    isEditing: false,
    x: 0,
    y: 0,
    text: '',
    elementId: null,
  });
  const textEditingRef = useRef(textEditing);

  // Keep ref in sync with state
  useEffect(() => {
    textEditingRef.current = textEditing;
  }, [textEditing]);

  // Track interaction state
  const [dragState, setDragState] = useState<{
    type: 'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'panning';
    startX: number;
    startY: number;
    elementId?: string;
    handle?: string;
    originalElement?: ScribblElement;
    centerX?: number;
    centerY?: number;
  }>({ type: 'none', startX: 0, startY: 0 });

  // Resize canvas to fit container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Callback to trigger re-render when images finish loading
  const handleImageLoad = useCallback(() => {
    setImageLoadCount(prev => prev + 1);
  }, []);

  // Render scene whenever elements or appState change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    renderScene(
      canvas,
      elements,
      appState,
      appState.selectedElementIds,
      alignmentGuides,
      textEditing.isEditing ? textEditing.elementId : null,
      handleImageLoad
    );
  }, [elements, appState, dimensions, alignmentGuides, textEditing.isEditing, textEditing.elementId, imageLoadCount, handleImageLoad]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If text editing is active, submit the text when clicking on canvas
      if (textEditing.isEditing) {
        const currentTextEditing = textEditingRef.current;

        // Calculate text dimensions
        let textWidth = 100;
        let textHeight = 24;
        const canvas = canvasRef.current;
        if (canvas && currentTextEditing.text.trim()) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '20px Virgil, cursive';
            const lines = currentTextEditing.text.split('\n');
            let maxWidth = 0;
            lines.forEach(line => {
              const metrics = ctx.measureText(line);
              maxWidth = Math.max(maxWidth, metrics.width);
            });
            textWidth = maxWidth || 100;
            textHeight = lines.length * 24 || 24;
          }
        }

        if (currentTextEditing.text.trim()) {
          history.push(elements);

          if (currentTextEditing.elementId) {
            // Update existing text element
            setElements(prev =>
              prev.map(el =>
                el.id === currentTextEditing.elementId
                  ? { ...el, text: currentTextEditing.text, width: textWidth, height: textHeight } as typeof el
                  : el
              )
            );
            setAppState(prev => ({
              ...prev,
              selectedElementIds: { [currentTextEditing.elementId!]: true },
              tool: 'selection',
            }));
          } else {
            // Create new text element
            const newElement = createElement('text', currentTextEditing.x, currentTextEditing.y, {
              text: currentTextEditing.text,
              strokeColor: appState.currentColor,
              fontSize: 20,
            });
            (newElement as any).width = textWidth;
            (newElement as any).height = textHeight;

            setElements(prev => [...prev, newElement]);
            setAppState(prev => ({
              ...prev,
              selectedElementIds: { [newElement.id]: true },
              tool: 'selection',
            }));
          }
        } else if (currentTextEditing.elementId) {
          // Delete element if text was cleared
          history.push(elements);
          setElements(prev => prev.filter(el => el.id !== currentTextEditing.elementId));
          setAppState(prev => ({ ...prev, tool: 'selection' }));
        }

        setTextEditing({ isEditing: false, x: 0, y: 0, text: '', elementId: null });
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getSceneCoordinates(e.clientX, e.clientY, canvas, appState);

      // Handle space + drag for panning
      if (e.button === 1 || appState.tool === 'pan') {
        setDragState({
          type: 'panning',
          startX: e.clientX,
          startY: e.clientY,
        });
        setAppState(prev => ({ ...prev, isPanning: true }));
        return;
      }

      // Selection tool
      if (appState.tool === 'selection') {
        // Check if clicking on resize/rotation handle of selected element
        const selectedIds = Object.keys(appState.selectedElementIds);
        if (selectedIds.length === 1) {
          const selectedElement = elements.find(el => el.id === selectedIds[0]);
          if (selectedElement) {
            const handle = getResizeHandle(point.x, point.y, selectedElement, appState);
            if (handle === 'rotation') {
              // Start rotation
              const cx = selectedElement.x + selectedElement.width / 2;
              const cy = selectedElement.y + selectedElement.height / 2;
              history.push(elements);
              setDragState({
                type: 'rotating',
                startX: point.x,
                startY: point.y,
                elementId: selectedElement.id,
                originalElement: { ...selectedElement },
                centerX: cx,
                centerY: cy,
              });
              return;
            } else if (handle) {
              history.push(elements);
              setDragState({
                type: 'resizing',
                startX: point.x,
                startY: point.y,
                elementId: selectedElement.id,
                handle,
                originalElement: { ...selectedElement },
              });
              return;
            }
          }
        }

        // Check if clicking on an element
        const element = getElementAtPosition(point.x, point.y, elements);
        if (element) {
          // Save for undo when we start moving
          history.push(elements);

          // Start moving the element
          setDragState({
            type: 'moving',
            startX: point.x,
            startY: point.y,
            elementId: element.id,
            originalElement: { ...element },
          });

          // Select the element (Shift to add to selection)
          if (e.shiftKey) {
            setAppState(prev => ({
              ...prev,
              selectedElementIds: {
                ...prev.selectedElementIds,
                [element.id]: true
              },
            }));
          } else {
            setAppState(prev => ({
              ...prev,
              selectedElementIds: { [element.id]: true },
            }));
          }
        } else {
          // Clear selection if clicking on empty space
          setAppState(prev => ({
            ...prev,
            selectedElementIds: {},
          }));
        }
        return;
      }

      // Drawing tools
      const drawingTools: Tool[] = ['rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'freedraw'];
      if (drawingTools.includes(appState.tool)) {
        // Save current state for undo
        history.push(elements);

        const newElement = createElement(appState.tool as ScribblElement['type'], point.x, point.y, {
          strokeColor: appState.currentColor,
          backgroundColor: appState.currentBackgroundColor,
          strokeWidth: appState.currentStrokeWidth,
          fillStyle: appState.currentFillStyle,
          roughness: appState.currentRoughness,
          opacity: appState.currentOpacity,
        });

        setElements(prev => [...prev, newElement]);
        setAppState(prev => ({
          ...prev,
          isDrawing: true,
          selectedElementIds: { [newElement.id]: true },
        }));
        setDragState({
          type: 'drawing',
          startX: point.x,
          startY: point.y,
          elementId: newElement.id,
        });
      }

      // Text tool - show inline editor
      if (appState.tool === 'text') {
        e.preventDefault();
        e.stopPropagation();
        setTextEditing({
          isEditing: true,
          x: point.x,
          y: point.y,
          text: '',
          elementId: null,
        });
        return; // Exit early to prevent any other handling
      }
    },
    [appState, elements, setElements, setAppState, history, textEditing.isEditing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getSceneCoordinates(e.clientX, e.clientY, canvas, appState);

      // Update cursor position
      setAppState(prev => ({ ...prev, cursorPosition: point }));

      // Handle panning
      if (dragState.type === 'panning') {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        setAppState(prev => ({
          ...prev,
          scrollX: prev.scrollX + deltaX,
          scrollY: prev.scrollY + deltaY,
        }));
        setDragState(prev => ({
          ...prev,
          startX: e.clientX,
          startY: e.clientY,
        }));
        return;
      }

      // Handle rotating element
      if (dragState.type === 'rotating' && dragState.elementId && dragState.centerX !== undefined) {
        const cx = dragState.centerX;
        const cy = dragState.centerY!;
        const angle = Math.atan2(point.y - cy, point.x - cx) + Math.PI / 2;

        setElements(prev =>
          prev.map(el =>
            el.id === dragState.elementId
              ? rotateElement(dragState.originalElement!, cx, cy, angle)
              : el
          )
        );
        return;
      }

      // Handle moving element with alignment guides
      if (dragState.type === 'moving' && dragState.elementId) {
        const deltaX = point.x - dragState.startX;
        const deltaY = point.y - dragState.startY;

        let movedElement = moveElement(dragState.originalElement!, deltaX, deltaY);

        // If moving a line/arrow, clear its bindings (user is detaching it)
        if (movedElement.type === 'line' || movedElement.type === 'arrow') {
          const lineEl = movedElement as LineElement | ArrowElement;
          if (lineEl.startBinding || lineEl.endBinding) {
            movedElement = clearArrowBindings(lineEl) as ScribblElement;
          }
        }

        // Get alignment guides
        const { guides, snapX, snapY } = getAlignmentGuides(movedElement, elements);
        setAlignmentGuides(guides);

        // Apply snapping
        let finalX = movedElement.x;
        let finalY = movedElement.y;

        if (snapX !== null) {
          // Snap to the alignment
          const movingLeft = movedElement.x;
          const movingCenter = movedElement.x + movedElement.width / 2;
          const movingRight = movedElement.x + movedElement.width;

          if (Math.abs(movingLeft - snapX) < 10) finalX = snapX;
          else if (Math.abs(movingCenter - snapX) < 10) finalX = snapX - movedElement.width / 2;
          else if (Math.abs(movingRight - snapX) < 10) finalX = snapX - movedElement.width;
        }

        if (snapY !== null) {
          const movingTop = movedElement.y;
          const movingCenter = movedElement.y + movedElement.height / 2;
          const movingBottom = movedElement.y + movedElement.height;

          if (Math.abs(movingTop - snapY) < 10) finalY = snapY;
          else if (Math.abs(movingCenter - snapY) < 10) finalY = snapY - movedElement.height / 2;
          else if (Math.abs(movingBottom - snapY) < 10) finalY = snapY - movedElement.height;
        }

        setElements(prev => {
          // First, update the moved element
          let updatedElements = prev.map(el =>
            el.id === dragState.elementId
              ? { ...movedElement, x: finalX, y: finalY }
              : el
          );

          // Then, update any arrows bound to this element (if it's not an arrow itself)
          if (movedElement.type !== 'line' && movedElement.type !== 'arrow' && movedElement.type !== 'freedraw') {
            updatedElements = updateBoundArrows(updatedElements, dragState.elementId!);
          }

          return updatedElements;
        });
        return;
      }

      // Handle resizing element
      if (dragState.type === 'resizing' && dragState.elementId && dragState.handle) {
        const deltaX = point.x - dragState.startX;
        const deltaY = point.y - dragState.startY;

        const resizedElement = resizeElement(dragState.originalElement!, dragState.handle!, deltaX, deltaY, e.shiftKey);

        setElements(prev => {
          let updatedElements = prev.map(el =>
            el.id === dragState.elementId ? resizedElement : el
          );

          // Update any arrows bound to this element (if it's a shape)
          if (resizedElement.type !== 'line' && resizedElement.type !== 'arrow' && resizedElement.type !== 'freedraw') {
            updatedElements = updateBoundArrows(updatedElements, dragState.elementId!);
          }

          return updatedElements;
        });
        return;
      }

      // Handle drawing with snapping for lines/arrows
      if (dragState.type === 'drawing' && dragState.elementId) {
        setElements(prev =>
          prev.map(el => {
            if (el.id !== dragState.elementId) return el;

            if (el.type === 'freedraw') {
              const newPoint = { x: point.x - el.x, y: point.y - el.y };
              return addPointToLine(el, newPoint) as ScribblElement;
            }

            if (el.type === 'line' || el.type === 'arrow') {
              // Check for snap points
              const snapPoint = findNearestSnapPoint(point, elements, [el.id]);
              const endPoint = snapPoint
                ? { x: snapPoint.x - el.x, y: snapPoint.y - el.y }
                : { x: point.x - el.x, y: point.y - el.y };

              // Update the last point
              const newPoints = [...el.points];
              if (newPoints.length === 1) {
                newPoints.push(endPoint);
              } else {
                newPoints[newPoints.length - 1] = endPoint;
              }
              return updateElement(el, {
                points: newPoints,
                width: Math.abs(point.x - dragState.startX),
                height: Math.abs(point.y - dragState.startY),
              } as any);
            }

            // Shapes (rectangle, ellipse, diamond) with shift for square/circle
            let width = point.x - dragState.startX;
            let height = point.y - dragState.startY;

            // Hold shift for equal dimensions
            if (e.shiftKey) {
              const size = Math.max(Math.abs(width), Math.abs(height));
              width = width < 0 ? -size : size;
              height = height < 0 ? -size : size;
            }

            // Handle negative dimensions
            const newX = width < 0 ? dragState.startX + width : dragState.startX;
            const newY = height < 0 ? dragState.startY + height : dragState.startY;

            return updateElement(el, {
              x: newX,
              y: newY,
              width: Math.abs(width),
              height: Math.abs(height),
            } as any);
          })
        );
      }
    },
    [appState, dragState, elements, setElements, setAppState]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState.type === 'drawing' && dragState.elementId) {
      // Finalize line/freedraw elements and create bindings for arrows/lines
      setElements(prev => {
        return prev.map(el => {
          if (el.id !== dragState.elementId) return el;

          if (el.type === 'line' || el.type === 'arrow') {
            // First update bounds
            const updatedEl = updateLineBounds(el) as LineElement | ArrowElement;

            // Check for bindings at start and end points
            const startPoint = {
              x: updatedEl.x + (updatedEl.points[0]?.x || 0),
              y: updatedEl.y + (updatedEl.points[0]?.y || 0),
            };
            const endPoint = {
              x: updatedEl.x + (updatedEl.points[updatedEl.points.length - 1]?.x || 0),
              y: updatedEl.y + (updatedEl.points[updatedEl.points.length - 1]?.y || 0),
            };

            // Find binding targets (exclude the arrow itself)
            const startTarget = findBindingTarget(startPoint, prev, [el.id]);
            const endTarget = findBindingTarget(endPoint, prev, [el.id]);

            return {
              ...updatedEl,
              startBinding: startTarget
                ? { elementId: startTarget.element.id, focus: startTarget.focus, gap: 0 }
                : null,
              endBinding: endTarget
                ? { elementId: endTarget.element.id, focus: endTarget.focus, gap: 0 }
                : null,
            } as ScribblElement;
          }

          if (el.type === 'freedraw') {
            return updateLineBounds(el) as ScribblElement;
          }

          return el;
        });
      });
    }

    // After resizing a text element, recalculate height based on wrapped text
    if (dragState.type === 'resizing' && dragState.elementId) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          setElements(prev =>
            prev.map(el => {
              if (el.id !== dragState.elementId || el.type !== 'text') return el;

              ctx.font = `${el.fontSize}px Virgil, cursive`;
              const wrappedLines = wrapText(ctx, el.text, el.width);
              const lineHeight = el.fontSize * 1.2;
              const newHeight = Math.max(wrappedLines.length * lineHeight, lineHeight);

              return {
                ...el,
                height: newHeight,
              } as ScribblElement;
            })
          );
        }
      }
    }

    // Clear alignment guides
    setAlignmentGuides([]);

    setDragState({ type: 'none', startX: 0, startY: 0 });
    setAppState(prev => ({
      ...prev,
      isDrawing: false,
      isPanning: false,
    }));
  }, [dragState, setElements, setAppState]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      // Zoom with ctrl+scroll, pan otherwise
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, appState.zoom * zoomFactor));

        // Zoom towards cursor position
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          setAppState(prev => ({
            ...prev,
            zoom: newZoom,
            scrollX: mouseX - (mouseX - prev.scrollX) * (newZoom / prev.zoom),
            scrollY: mouseY - (mouseY - prev.scrollY) * (newZoom / prev.zoom),
          }));
        }
      } else {
        // Pan
        setAppState(prev => ({
          ...prev,
          scrollX: prev.scrollX - e.deltaX,
          scrollY: prev.scrollY - e.deltaY,
        }));
      }
    },
    [appState.zoom, setAppState]
  );

  // Handle image drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) return;

      const point = getSceneCoordinates(e.clientX, e.clientY, canvas, appState);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          history.push(elements);

          const newElement = createElement('image', point.x, point.y, {
            width: img.width,
            height: img.height,
            fileId: event.target?.result as string,
          });

          setElements(prev => [...prev, newElement]);
          setAppState(prev => ({
            ...prev,
            selectedElementIds: { [newElement.id]: true },
          }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [appState, elements, setElements, setAppState, history]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  // Handle double-click to edit text elements
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getSceneCoordinates(e.clientX, e.clientY, canvas, appState);
      const element = getElementAtPosition(point.x, point.y, elements);

      // If double-clicked on a text element, enter edit mode
      if (element && element.type === 'text') {
        e.preventDefault();
        e.stopPropagation();
        setTextEditing({
          isEditing: true,
          x: element.x,
          y: element.y,
          text: (element as any).text || '',
          elementId: element.id,
        });
      }
    },
    [appState, elements]
  );

  // Handle text editing completion
  const handleTextSubmit = useCallback(() => {
    const currentTextEditing = textEditingRef.current;

    if (!currentTextEditing.isEditing) {
      setTextEditing({ isEditing: false, x: 0, y: 0, text: '', elementId: null });
      return;
    }

    // If text is empty, delete the element if editing, or just cancel if creating new
    if (!currentTextEditing.text.trim()) {
      if (currentTextEditing.elementId) {
        // Delete the existing text element
        history.push(elements);
        setElements(prev => prev.filter(el => el.id !== currentTextEditing.elementId));
      }
      setTextEditing({ isEditing: false, x: 0, y: 0, text: '', elementId: null });
      setAppState(prev => ({ ...prev, tool: 'selection' }));
      return;
    }

    history.push(elements);

    // Calculate text dimensions
    let textWidth = 100;
    let textHeight = 24;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '20px Virgil, cursive';
        const lines = currentTextEditing.text.split('\n');
        let maxWidth = 0;
        lines.forEach(line => {
          const metrics = ctx.measureText(line);
          maxWidth = Math.max(maxWidth, metrics.width);
        });
        textWidth = maxWidth || 100;
        textHeight = lines.length * 24 || 24;
      }
    }

    if (currentTextEditing.elementId) {
      // Update existing text element
      setElements(prev =>
        prev.map(el =>
          el.id === currentTextEditing.elementId
            ? {
                ...el,
                text: currentTextEditing.text,
                width: textWidth,
                height: textHeight,
              } as typeof el
            : el
        )
      );
      setAppState(prev => ({
        ...prev,
        selectedElementIds: { [currentTextEditing.elementId!]: true },
        tool: 'selection',
      }));
    } else {
      // Create new text element
      const newElement = createElement('text', currentTextEditing.x, currentTextEditing.y, {
        text: currentTextEditing.text,
        strokeColor: appState.currentColor,
        fontSize: 20,
      });
      (newElement as any).width = textWidth;
      (newElement as any).height = textHeight;

      setElements(prev => [...prev, newElement]);
      setAppState(prev => ({
        ...prev,
        selectedElementIds: { [newElement.id]: true },
        tool: 'selection',
      }));
    }

    setTextEditing({ isEditing: false, x: 0, y: 0, text: '', elementId: null });
  }, [elements, appState.currentColor, setElements, setAppState, history]);

  // Handle text editing keyboard events
  const handleTextKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      // Cancel text editing
      setTextEditing({ isEditing: false, x: 0, y: 0, text: '', elementId: null });
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Submit text (Shift+Enter for newline)
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (textEditing.isEditing && textareaRef.current) {
      // Use requestAnimationFrame to ensure the DOM is ready
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        // Also select all text if there's any
        textareaRef.current?.select();
      });
    }
  }, [textEditing.isEditing]);

  // Get cursor style based on tool and position
  const getCursor = () => {
    if (appState.isPanning) return 'grabbing';
    if (appState.tool === 'pan') return 'grab';
    if (appState.tool === 'selection') return 'default';
    if (appState.tool === 'text') return 'text';
    if (dragState.type === 'rotating') return 'grabbing';
    return 'crosshair';
  };

  // Calculate viewport position for text editor
  const getTextEditorPosition = () => {
    const viewportPos = getViewportCoordinates(textEditing.x, textEditing.y, appState);
    return {
      left: viewportPos.x,
      top: viewportPos.y,
    };
  };

  // Get the editing element's dimensions
  const getEditingElementSize = () => {
    if (textEditing.elementId) {
      const element = elements.find(el => el.id === textEditing.elementId);
      if (element) {
        return {
          width: element.width * appState.zoom,
          height: element.height * appState.zoom,
        };
      }
    }
    return { width: 200, height: 24 };
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          cursor: getCursor(),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Inline text editor */}
      {textEditing.isEditing && (
        <textarea
          ref={textareaRef}
          value={textEditing.text}
          onChange={(e) => setTextEditing(prev => ({ ...prev, text: e.target.value }))}
          onKeyDown={handleTextKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: getTextEditorPosition().left,
            top: getTextEditorPosition().top,
            width: `${getEditingElementSize().width}px`,
            height: `${getEditingElementSize().height}px`,
            minWidth: '50px',
            minHeight: '24px',
            fontSize: `${20 * appState.zoom}px`,
            fontFamily: 'Virgil, cursive',
            color: appState.currentColor,
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            padding: '0',
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            zIndex: 1000,
            lineHeight: 1.2,
            boxShadow: 'none',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          placeholder="Type here..."
          autoFocus
        />
      )}
    </div>
  );
}
