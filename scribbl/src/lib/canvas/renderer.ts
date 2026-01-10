import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { ScribblElement, Point, AppState } from '@/types';
import type { AlignmentGuide } from './snapping';

// Image cache for rendered images
const imageCache = new Map<string, HTMLImageElement>();

// Wrap text to fit within a given width
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (maxWidth <= 0) return [text];

  const result: string[] = [];
  // First split by explicit newlines
  const paragraphs = text.split('\n');

  paragraphs.forEach(paragraph => {
    if (!paragraph) {
      result.push('');
      return;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      result.push(currentLine);
    }
  });

  return result.length > 0 ? result : [''];
}

export function getSceneCoordinates(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  appState: AppState
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - appState.scrollX) / appState.zoom,
    y: (clientY - rect.top - appState.scrollY) / appState.zoom,
  };
}

export function getViewportCoordinates(
  x: number,
  y: number,
  appState: AppState
): Point {
  return {
    x: x * appState.zoom + appState.scrollX,
    y: y * appState.zoom + appState.scrollY,
  };
}

export function renderElement(
  roughCanvas: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: ScribblElement,
  appState: AppState,
  onImageLoad?: () => void
) {
  if (element.isDeleted) return;

  const { x, y, width, height, strokeColor, backgroundColor, strokeWidth, roughness } = element;

  // Apply viewport transformation
  const vx = x * appState.zoom + appState.scrollX;
  const vy = y * appState.zoom + appState.scrollY;
  const vw = width * appState.zoom;
  const vh = height * appState.zoom;

  ctx.save();
  ctx.globalAlpha = element.opacity / 100;

  // Apply rotation if needed
  if (element.angle !== 0) {
    const cx = vx + vw / 2;
    const cy = vy + vh / 2;
    ctx.translate(cx, cy);
    ctx.rotate(element.angle);
    ctx.translate(-cx, -cy);
  }

  const options = {
    seed: element.seed,
    roughness: roughness,
    stroke: strokeColor,
    strokeWidth: strokeWidth * appState.zoom,
    fill: backgroundColor !== 'transparent' ? backgroundColor : undefined,
    fillStyle: element.fillStyle,
    hachureGap: 4 * appState.zoom,
    hachureAngle: -41,
  };

  switch (element.type) {
    case 'rectangle':
      roughCanvas.rectangle(vx, vy, vw, vh, options);
      break;

    case 'ellipse':
      roughCanvas.ellipse(
        vx + vw / 2,
        vy + vh / 2,
        vw,
        vh,
        options
      );
      break;

    case 'diamond':
      const diamondPoints: [number, number][] = [
        [vx + vw / 2, vy],
        [vx + vw, vy + vh / 2],
        [vx + vw / 2, vy + vh],
        [vx, vy + vh / 2],
      ];
      roughCanvas.polygon(diamondPoints, options);
      break;

    case 'line':
    case 'arrow':
      if (element.points.length >= 2) {
        const scaledPoints = element.points.map(p => ({
          x: (element.x + p.x) * appState.zoom + appState.scrollX,
          y: (element.y + p.y) * appState.zoom + appState.scrollY,
        }));

        // Draw line segments
        for (let i = 0; i < scaledPoints.length - 1; i++) {
          roughCanvas.line(
            scaledPoints[i].x,
            scaledPoints[i].y,
            scaledPoints[i + 1].x,
            scaledPoints[i + 1].y,
            options
          );
        }

        // Draw arrow head for arrow type
        if (element.type === 'arrow' && scaledPoints.length >= 2) {
          const lastPoint = scaledPoints[scaledPoints.length - 1];
          const prevPoint = scaledPoints[scaledPoints.length - 2];
          drawArrowhead(ctx, prevPoint, lastPoint, strokeColor, strokeWidth * appState.zoom);
        }
      }
      break;

    case 'freedraw':
      if (element.points.length >= 2) {
        const scaledPoints = element.points.map(p => [
          (element.x + p.x) * appState.zoom + appState.scrollX,
          (element.y + p.y) * appState.zoom + appState.scrollY,
        ] as [number, number]);

        roughCanvas.curve(scaledPoints, {
          ...options,
          fill: undefined,
        });
      }
      break;

    case 'text':
      ctx.font = `${element.fontSize * appState.zoom}px Virgil, cursive`;
      ctx.fillStyle = strokeColor;
      ctx.textAlign = element.textAlign;
      ctx.textBaseline = 'top';

      const textX = element.textAlign === 'center' ? vx + vw / 2 :
                    element.textAlign === 'right' ? vx + vw : vx;

      // Wrap text to fit within element width
      const wrappedLines = wrapText(ctx, element.text, vw);
      const lineHeight = element.fontSize * 1.2 * appState.zoom;

      // Calculate vertical offset based on alignment
      const totalTextHeight = wrappedLines.length * lineHeight;
      let textY = vy;
      if (element.verticalAlign === 'middle') {
        textY = vy + (vh - totalTextHeight) / 2;
      } else if (element.verticalAlign === 'bottom') {
        textY = vy + vh - totalTextHeight;
      }

      // Apply stroke width as text outline
      const scaledStrokeWidth = strokeWidth * appState.zoom;
      if (scaledStrokeWidth > 1) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = scaledStrokeWidth;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        wrappedLines.forEach((line, i) => {
          ctx.strokeText(line, textX, textY + i * lineHeight);
        });
      }

      wrappedLines.forEach((line, i) => {
        ctx.fillText(line, textX, textY + i * lineHeight);
      });
      break;

    case 'image':
      // Render image if fileId contains data URL
      if (element.fileId && element.fileId.startsWith('data:')) {
        const img = imageCache.get(element.fileId);
        if (img) {
          ctx.drawImage(img, vx, vy, vw, vh);
        } else {
          // Load and cache the image
          const newImg = new Image();
          newImg.onload = () => {
            imageCache.set(element.fileId, newImg);
            // Trigger re-render after image loads
            if (onImageLoad) {
              onImageLoad();
            }
          };
          newImg.src = element.fileId;
        }
      }
      break;
  }

  ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  strokeWidth: number
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = Math.max(15, strokeWidth * 3);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  ctx.restore();
}

export function renderScene(
  canvas: HTMLCanvasElement,
  elements: ScribblElement[],
  appState: AppState,
  selectedElementIds: Record<string, boolean>,
  alignmentGuides: AlignmentGuide[] = [],
  editingElementId: string | null = null,
  onImageLoad?: () => void
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const roughCanvas = rough.canvas(canvas);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid if enabled
  if (appState.showGrid) {
    drawGrid(ctx, canvas, appState);
  }

  // Render all elements
  elements.forEach(element => {
    // Skip rendering text element that is being edited (textarea handles it)
    if (element.type === 'text' && element.id === editingElementId) {
      return;
    }
    renderElement(roughCanvas, ctx, element, appState, onImageLoad);
  });

  // Draw selection boxes for selected elements
  Object.keys(selectedElementIds).forEach(id => {
    const element = elements.find(el => el.id === id);
    if (element && !element.isDeleted) {
      drawSelectionBox(ctx, element, appState);
    }
  });

  // Draw alignment guides
  if (alignmentGuides.length > 0) {
    drawAlignmentGuides(ctx, alignmentGuides, appState);
  }
}

function drawAlignmentGuides(
  ctx: CanvasRenderingContext2D,
  guides: AlignmentGuide[],
  appState: AppState
) {
  ctx.save();
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  guides.forEach(guide => {
    ctx.beginPath();
    if (guide.type === 'vertical') {
      const x = guide.position * appState.zoom + appState.scrollX;
      ctx.moveTo(x, guide.start * appState.zoom + appState.scrollY);
      ctx.lineTo(x, guide.end * appState.zoom + appState.scrollY);
    } else {
      const y = guide.position * appState.zoom + appState.scrollY;
      ctx.moveTo(guide.start * appState.zoom + appState.scrollX, y);
      ctx.lineTo(guide.end * appState.zoom + appState.scrollX, y);
    }
    ctx.stroke();
  });

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  appState: AppState
) {
  const gridSize = appState.gridSize * appState.zoom;
  const offsetX = appState.scrollX % gridSize;
  const offsetY = appState.scrollY % gridSize;

  ctx.save();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = offsetY; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  element: ScribblElement,
  appState: AppState
) {
  const padding = 5;
  const vw = element.width * appState.zoom + padding * 2;
  const vh = element.height * appState.zoom + padding * 2;

  // Calculate center of element in viewport coordinates
  const centerX = (element.x + element.width / 2) * appState.zoom + appState.scrollX;
  const centerY = (element.y + element.height / 2) * appState.zoom + appState.scrollY;

  ctx.save();

  // Apply rotation around the element's center
  ctx.translate(centerX, centerY);
  ctx.rotate(element.angle);

  // Draw from center (offset by half width/height)
  const halfW = vw / 2;
  const halfH = vh / 2;

  // Draw selection border
  ctx.strokeStyle = '#0099ff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(-halfW, -halfH, vw, vh);

  // Draw resize handles
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0099ff';
  ctx.setLineDash([]);
  ctx.lineWidth = 1.5;

  const handleSize = 8;
  const hs = handleSize / 2;
  const handles = [
    { x: -halfW - hs, y: -halfH - hs }, // top-left
    { x: -hs, y: -halfH - hs }, // top-center
    { x: halfW - hs, y: -halfH - hs }, // top-right
    { x: halfW - hs, y: -hs }, // right-center
    { x: halfW - hs, y: halfH - hs }, // bottom-right
    { x: -hs, y: halfH - hs }, // bottom-center
    { x: -halfW - hs, y: halfH - hs }, // bottom-left
    { x: -halfW - hs, y: -hs }, // left-center
  ];

  handles.forEach(handle => {
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
  });

  // Draw rotation handle
  const rotationHandleOffset = 30;
  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, -halfH - rotationHandleOffset + handleSize / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -halfH - rotationHandleOffset, handleSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function getElementAtPosition(
  x: number,
  y: number,
  elements: ScribblElement[]
): ScribblElement | null {
  // Iterate in reverse order (top-most elements first)
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.isDeleted) continue;

    if (isPointInElement(x, y, element)) {
      return element;
    }
  }
  return null;
}

function isPointInElement(x: number, y: number, element: ScribblElement): boolean {
  const { x: ex, y: ey, width, height, angle } = element;

  // Transform point to element's local coordinate system if rotated
  let localX = x;
  let localY = y;

  if (angle !== 0) {
    // Calculate element center
    const cx = ex + width / 2;
    const cy = ey + height / 2;

    // Rotate point around element center by negative angle
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = x - cx;
    const dy = y - cy;
    localX = cx + dx * cos - dy * sin;
    localY = cy + dx * sin + dy * cos;
  }

  switch (element.type) {
    case 'rectangle':
    case 'text':
    case 'image':
      return localX >= ex && localX <= ex + width && localY >= ey && localY <= ey + height;

    case 'ellipse':
      const ecx = ex + width / 2;
      const ecy = ey + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      return Math.pow((localX - ecx) / rx, 2) + Math.pow((localY - ecy) / ry, 2) <= 1;

    case 'diamond':
      // Check if point is inside diamond using barycentric coordinates
      const dcx = ex + width / 2;
      const dcy = ey + height / 2;
      const ddx = Math.abs(localX - dcx);
      const ddy = Math.abs(localY - dcy);
      return (ddx / (width / 2) + ddy / (height / 2)) <= 1;

    case 'line':
    case 'arrow':
      // Check if point is near any line segment
      if (element.points.length < 2) return false;
      for (let i = 0; i < element.points.length - 1; i++) {
        const p1 = element.points[i];
        const p2 = element.points[i + 1];
        if (distanceToLineSegment(
          { x: localX - ex, y: localY - ey },
          p1,
          p2
        ) < 10) {
          return true;
        }
      }
      return false;

    case 'freedraw':
      if (element.points.length < 2) return false;
      for (let i = 0; i < element.points.length - 1; i++) {
        const p1 = element.points[i];
        const p2 = element.points[i + 1];
        if (distanceToLineSegment(
          { x: localX - ex, y: localY - ey },
          p1,
          p2
        ) < 10) {
          return true;
        }
      }
      return false;

    default:
      return false;
  }
}

function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  return Math.sqrt(
    Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
  );
}

export function getResizeHandle(
  x: number,
  y: number,
  element: ScribblElement,
  appState: AppState
): string | null {
  const padding = 5;
  const handleSize = 8;
  const vw = element.width * appState.zoom + padding * 2;
  const vh = element.height * appState.zoom + padding * 2;
  const halfW = vw / 2;
  const halfH = vh / 2;

  // Calculate center of element in viewport coordinates
  const centerX = (element.x + element.width / 2) * appState.zoom + appState.scrollX;
  const centerY = (element.y + element.height / 2) * appState.zoom + appState.scrollY;

  const clientX = x * appState.zoom + appState.scrollX;
  const clientY = y * appState.zoom + appState.scrollY;

  // Transform click point to element's local coordinate system (unrotate)
  let localX = clientX;
  let localY = clientY;

  if (element.angle !== 0) {
    const cos = Math.cos(-element.angle);
    const sin = Math.sin(-element.angle);
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    localX = centerX + dx * cos - dy * sin;
    localY = centerY + dx * sin + dy * cos;
  }

  // Handle positions relative to center
  const handles = [
    { x: centerX - halfW, y: centerY - halfH, name: 'top-left' },
    { x: centerX, y: centerY - halfH, name: 'top' },
    { x: centerX + halfW, y: centerY - halfH, name: 'top-right' },
    { x: centerX + halfW, y: centerY, name: 'right' },
    { x: centerX + halfW, y: centerY + halfH, name: 'bottom-right' },
    { x: centerX, y: centerY + halfH, name: 'bottom' },
    { x: centerX - halfW, y: centerY + halfH, name: 'bottom-left' },
    { x: centerX - halfW, y: centerY, name: 'left' },
  ];

  for (const handle of handles) {
    if (
      localX >= handle.x - handleSize &&
      localX <= handle.x + handleSize &&
      localY >= handle.y - handleSize &&
      localY <= handle.y + handleSize
    ) {
      return handle.name;
    }
  }

  // Check rotation handle (at top center, offset by 30px)
  const rotationHandleY = centerY - halfH - 30;
  if (
    localX >= centerX - handleSize &&
    localX <= centerX + handleSize &&
    localY >= rotationHandleY - handleSize &&
    localY <= rotationHandleY + handleSize
  ) {
    return 'rotation';
  }

  return null;
}
