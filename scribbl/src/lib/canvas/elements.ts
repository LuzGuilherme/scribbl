import { nanoid } from 'nanoid';
import type {
  ScribblElement,
  RectangleElement,
  EllipseElement,
  DiamondElement,
  LineElement,
  ArrowElement,
  FreedrawElement,
  TextElement,
  Point,
  DEFAULT_ELEMENT_PROPS,
} from '@/types';
import { COLORS } from '@/types';

const DEFAULT_PROPS = {
  strokeColor: COLORS.black,
  backgroundColor: COLORS.transparent,
  fillStyle: 'hachure' as const,
  strokeWidth: 2,
  roughness: 1,
  opacity: 100,
  angle: 0,
  groupId: null,
  isDeleted: false,
};

export function createElement(
  type: ScribblElement['type'],
  x: number,
  y: number,
  options: Partial<ScribblElement> = {}
): ScribblElement {
  const baseProps = {
    id: nanoid(),
    x,
    y,
    width: 0,
    height: 0,
    seed: Math.floor(Math.random() * 2000000000),
    ...DEFAULT_PROPS,
    ...options,
  };

  switch (type) {
    case 'rectangle':
      return {
        ...baseProps,
        type: 'rectangle',
      } as RectangleElement;

    case 'ellipse':
      return {
        ...baseProps,
        type: 'ellipse',
      } as EllipseElement;

    case 'diamond':
      return {
        ...baseProps,
        type: 'diamond',
      } as DiamondElement;

    case 'line':
      return {
        ...baseProps,
        type: 'line',
        points: [{ x: 0, y: 0 }],
        startBinding: null,
        endBinding: null,
      } as LineElement;

    case 'arrow':
      return {
        ...baseProps,
        type: 'arrow',
        points: [{ x: 0, y: 0 }],
        startBinding: null,
        endBinding: null,
      } as ArrowElement;

    case 'freedraw':
      return {
        ...baseProps,
        type: 'freedraw',
        points: [],
        pressures: [],
      } as FreedrawElement;

    case 'text':
      return {
        type: 'text',
        text: '',
        fontSize: 20,
        fontFamily: 'Virgil',
        textAlign: 'left',
        verticalAlign: 'top',
        ...baseProps,  // Put baseProps last so options can override defaults
        strokeWidth: options.strokeWidth ?? 1,  // Default stroke width for text is 1
      } as TextElement;

    case 'image':
      return {
        type: 'image',
        fileId: '',
        scale: [1, 1],
        ...baseProps,  // baseProps (which includes options) must come last to allow fileId override
      } as any;

    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}

export function updateElement<T extends ScribblElement>(
  element: T,
  updates: Partial<T>
): T {
  return {
    ...element,
    ...updates,
  };
}

export function resizeElement(
  element: ScribblElement,
  handle: string,
  deltaX: number,
  deltaY: number,
  lockAspectRatio: boolean = false
): ScribblElement {
  let { x, y, width, height } = element;

  // Store original dimensions for scaling points and aspect ratio
  const originalWidth = width;
  const originalHeight = height;
  const aspectRatio = originalWidth / (originalHeight || 1);

  switch (handle) {
    case 'top-left':
      x += deltaX;
      y += deltaY;
      width -= deltaX;
      height -= deltaY;
      break;
    case 'top':
      y += deltaY;
      height -= deltaY;
      break;
    case 'top-right':
      y += deltaY;
      width += deltaX;
      height -= deltaY;
      break;
    case 'right':
      width += deltaX;
      break;
    case 'bottom-right':
      width += deltaX;
      height += deltaY;
      break;
    case 'bottom':
      height += deltaY;
      break;
    case 'bottom-left':
      x += deltaX;
      width -= deltaX;
      height += deltaY;
      break;
    case 'left':
      x += deltaX;
      width -= deltaX;
      break;
  }

  // Normalize negative dimensions
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  // Apply aspect ratio lock if enabled
  if (lockAspectRatio && originalWidth > 0 && originalHeight > 0) {
    // Determine which dimension changed more and adjust the other
    const widthChange = Math.abs(width - originalWidth);
    const heightChange = Math.abs(height - originalHeight);

    if (handle === 'top' || handle === 'bottom') {
      // Vertical-only handles: adjust width based on height
      const newWidth = height * aspectRatio;
      const widthDiff = newWidth - width;
      x -= widthDiff / 2; // Center horizontally
      width = newWidth;
    } else if (handle === 'left' || handle === 'right') {
      // Horizontal-only handles: adjust height based on width
      const newHeight = width / aspectRatio;
      const heightDiff = newHeight - height;
      y -= heightDiff / 2; // Center vertically
      height = newHeight;
    } else {
      // Corner handles: use the larger change to determine scale
      if (widthChange >= heightChange) {
        const newHeight = width / aspectRatio;
        if (handle === 'top-left' || handle === 'top-right') {
          y -= (newHeight - height);
        }
        height = newHeight;
      } else {
        const newWidth = height * aspectRatio;
        if (handle === 'top-left' || handle === 'bottom-left') {
          x -= (newWidth - width);
        }
        width = newWidth;
      }
    }
  }

  // For line/arrow/freedraw: scale the points array proportionally
  if (
    (element.type === 'line' || element.type === 'arrow' || element.type === 'freedraw') &&
    'points' in element &&
    element.points.length > 0
  ) {
    // Calculate scale factors (avoid division by zero)
    const scaleX = originalWidth > 0 ? width / originalWidth : 1;
    const scaleY = originalHeight > 0 ? height / originalHeight : 1;

    // Scale all points
    const scaledPoints = element.points.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    return updateElement(element, {
      x,
      y,
      width,
      height,
      points: scaledPoints,
    } as Partial<typeof element>);
  }

  return updateElement(element, { x, y, width, height } as Partial<typeof element>);
}

export function moveElement(
  element: ScribblElement,
  deltaX: number,
  deltaY: number
): ScribblElement {
  return updateElement(element, {
    x: element.x + deltaX,
    y: element.y + deltaY,
  } as Partial<typeof element>);
}

export function rotateElement(
  element: ScribblElement,
  cx: number,
  cy: number,
  angle: number
): ScribblElement {
  return updateElement(element, { angle } as Partial<typeof element>);
}

export function duplicateElement(element: ScribblElement, offset = 10): ScribblElement {
  return {
    ...element,
    id: nanoid(),
    x: element.x + offset,
    y: element.y + offset,
    seed: Math.floor(Math.random() * 2000000000),
  };
}

export function deleteElement(element: ScribblElement): ScribblElement {
  return updateElement(element, { isDeleted: true } as Partial<typeof element>);
}

export function getBoundingBox(elements: ScribblElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  const visibleElements = elements.filter(el => !el.isDeleted);
  if (visibleElements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  visibleElements.forEach(element => {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function groupElements(elements: ScribblElement[], groupId: string): ScribblElement[] {
  return elements.map(el => updateElement(el, { groupId } as Partial<typeof el>));
}

export function ungroupElements(elements: ScribblElement[]): ScribblElement[] {
  return elements.map(el => updateElement(el, { groupId: null } as Partial<typeof el>));
}

export function addPointToLine(
  element: LineElement | ArrowElement | FreedrawElement,
  point: Point
): LineElement | ArrowElement | FreedrawElement {
  if (element.type === 'freedraw') {
    return {
      ...element,
      points: [...element.points, point],
      pressures: [...element.pressures, 0.5],
    };
  }
  return {
    ...element,
    points: [...element.points, point],
  };
}

export function updateLineBounds(element: LineElement | ArrowElement | FreedrawElement): ScribblElement {
  if (element.points.length === 0) return element;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  element.points.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  // Normalize points to be relative to the new origin
  const normalizedPoints = element.points.map(point => ({
    x: point.x - minX,
    y: point.y - minY,
  }));

  return {
    ...element,
    x: element.x + minX,
    y: element.y + minY,
    width: maxX - minX || 1,
    height: maxY - minY || 1,
    points: normalizedPoints,
  } as typeof element;
}
