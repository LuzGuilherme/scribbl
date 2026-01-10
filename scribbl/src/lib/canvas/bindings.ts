import type { ScribblElement, Point, LineElement, ArrowElement } from '@/types';
import { updateLineBounds } from './elements';

const BINDING_THRESHOLD = 15; // Distance threshold for binding detection

export interface Binding {
  elementId: string;
  focus: number;
  gap: number;
}

export interface BindingTarget {
  element: ScribblElement;
  focus: number;
  point: Point;
}

/**
 * Get the connection point on a shape's edge based on focus (0-1)
 * Focus maps around the perimeter of the shape
 */
export function getBindingPoint(
  element: ScribblElement,
  focus: number,
  gap: number = 0
): Point {
  const { x, y, width, height } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Normalize focus to 0-1 range
  focus = ((focus % 1) + 1) % 1;

  if (element.type === 'ellipse') {
    // For ellipse, focus is the angle (0-1 maps to 0-2π)
    const angle = focus * 2 * Math.PI;
    const rx = width / 2;
    const ry = height / 2;
    return {
      x: cx + (rx + gap) * Math.cos(angle),
      y: cy + (ry + gap) * Math.sin(angle),
    };
  }

  if (element.type === 'diamond') {
    // For diamond, focus maps to the 4 edges
    const halfW = width / 2;
    const halfH = height / 2;

    if (focus < 0.25) {
      // Top-right edge
      const t = focus * 4;
      return {
        x: cx + halfW * (1 - t) + gap,
        y: y + halfH * t + gap,
      };
    } else if (focus < 0.5) {
      // Bottom-right edge
      const t = (focus - 0.25) * 4;
      return {
        x: cx + halfW * (1 - t) + gap,
        y: cy + halfH * t + gap,
      };
    } else if (focus < 0.75) {
      // Bottom-left edge
      const t = (focus - 0.5) * 4;
      return {
        x: cx - halfW * t - gap,
        y: cy + halfH * (1 - t) + gap,
      };
    } else {
      // Top-left edge
      const t = (focus - 0.75) * 4;
      return {
        x: x + halfW * t - gap,
        y: cy - halfH * t - gap,
      };
    }
  }

  // Default: rectangle (and other shapes)
  // Focus maps around the perimeter: top (0-0.25), right (0.25-0.5), bottom (0.5-0.75), left (0.75-1)
  const perimeter = 2 * (width + height);
  const distance = focus * perimeter;

  if (distance < width) {
    // Top edge (left to right)
    return { x: x + distance, y: y - gap };
  } else if (distance < width + height) {
    // Right edge (top to bottom)
    return { x: x + width + gap, y: y + (distance - width) };
  } else if (distance < 2 * width + height) {
    // Bottom edge (right to left)
    return { x: x + width - (distance - width - height), y: y + height + gap };
  } else {
    // Left edge (bottom to top)
    return { x: x - gap, y: y + height - (distance - 2 * width - height) };
  }
}

/**
 * Calculate focus value (0-1) from a point near a shape's edge
 */
export function calculateFocus(element: ScribblElement, point: Point): number {
  const { x, y, width, height } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (element.type === 'ellipse') {
    // For ellipse, calculate angle
    const angle = Math.atan2(point.y - cy, point.x - cx);
    return ((angle / (2 * Math.PI)) + 1) % 1;
  }

  if (element.type === 'diamond') {
    // For diamond, determine which edge and position on that edge
    const dx = point.x - cx;
    const dy = point.y - cy;
    const halfW = width / 2;
    const halfH = height / 2;

    // Determine quadrant
    if (dx >= 0 && dy <= 0) {
      // Top-right quadrant
      const t = halfW > 0 ? (halfW - dx) / halfW : 0;
      return t * 0.25;
    } else if (dx >= 0 && dy > 0) {
      // Bottom-right quadrant
      const t = halfH > 0 ? dy / halfH : 0;
      return 0.25 + t * 0.25;
    } else if (dx < 0 && dy >= 0) {
      // Bottom-left quadrant
      const t = halfW > 0 ? -dx / halfW : 0;
      return 0.5 + t * 0.25;
    } else {
      // Top-left quadrant
      const t = halfH > 0 ? -dy / halfH : 0;
      return 0.75 + t * 0.25;
    }
  }

  // Default: rectangle
  // Determine which edge the point is closest to
  const distToTop = Math.abs(point.y - y);
  const distToBottom = Math.abs(point.y - (y + height));
  const distToLeft = Math.abs(point.x - x);
  const distToRight = Math.abs(point.x - (x + width));

  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
  const perimeter = 2 * (width + height);

  if (minDist === distToTop) {
    // Top edge
    const t = width > 0 ? Math.max(0, Math.min(1, (point.x - x) / width)) : 0;
    return (t * width) / perimeter;
  } else if (minDist === distToRight) {
    // Right edge
    const t = height > 0 ? Math.max(0, Math.min(1, (point.y - y) / height)) : 0;
    return (width + t * height) / perimeter;
  } else if (minDist === distToBottom) {
    // Bottom edge
    const t = width > 0 ? Math.max(0, Math.min(1, 1 - (point.x - x) / width)) : 0;
    return (width + height + t * width) / perimeter;
  } else {
    // Left edge
    const t = height > 0 ? Math.max(0, Math.min(1, 1 - (point.y - y) / height)) : 0;
    return (2 * width + height + t * height) / perimeter;
  }
}

/**
 * Find the nearest binding target for a point
 */
export function findBindingTarget(
  point: Point,
  elements: ScribblElement[],
  excludeIds: string[] = []
): BindingTarget | null {
  let nearestTarget: BindingTarget | null = null;
  let nearestDistance = BINDING_THRESHOLD;

  for (const element of elements) {
    // Skip excluded elements, deleted elements, and non-bindable types
    if (
      excludeIds.includes(element.id) ||
      element.isDeleted ||
      element.type === 'line' ||
      element.type === 'arrow' ||
      element.type === 'freedraw' ||
      element.type === 'text'
    ) {
      continue;
    }

    // Get the closest point on the element's edge
    const closestPoint = getClosestPointOnElement(point, element);
    const distance = Math.sqrt(
      Math.pow(point.x - closestPoint.x, 2) + Math.pow(point.y - closestPoint.y, 2)
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestTarget = {
        element,
        focus: calculateFocus(element, closestPoint),
        point: closestPoint,
      };
    }
  }

  return nearestTarget;
}

/**
 * Get the closest point on an element's edge to a given point
 */
function getClosestPointOnElement(point: Point, element: ScribblElement): Point {
  const { x, y, width, height } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (element.type === 'ellipse') {
    // For ellipse, find point on ellipse closest to the given point
    const angle = Math.atan2(point.y - cy, point.x - cx);
    const rx = width / 2;
    const ry = height / 2;
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  if (element.type === 'diamond') {
    // For diamond, find closest edge point
    const halfW = width / 2;
    const halfH = height / 2;

    // Diamond vertices
    const top = { x: cx, y: y };
    const right = { x: x + width, y: cy };
    const bottom = { x: cx, y: y + height };
    const left = { x: x, y: cy };

    // Find closest point on each edge and return the nearest
    const edges = [
      closestPointOnLineSegment(point, top, right),
      closestPointOnLineSegment(point, right, bottom),
      closestPointOnLineSegment(point, bottom, left),
      closestPointOnLineSegment(point, left, top),
    ];

    let closest = edges[0];
    let minDist = distanceBetween(point, closest);

    for (const edgePoint of edges) {
      const dist = distanceBetween(point, edgePoint);
      if (dist < minDist) {
        minDist = dist;
        closest = edgePoint;
      }
    }

    return closest;
  }

  // Default: rectangle - clamp to nearest edge
  const clampedX = Math.max(x, Math.min(x + width, point.x));
  const clampedY = Math.max(y, Math.min(y + height, point.y));

  // Determine which edge to snap to
  const distToTop = Math.abs(point.y - y);
  const distToBottom = Math.abs(point.y - (y + height));
  const distToLeft = Math.abs(point.x - x);
  const distToRight = Math.abs(point.x - (x + width));

  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);

  if (minDist === distToTop) {
    return { x: clampedX, y: y };
  } else if (minDist === distToBottom) {
    return { x: clampedX, y: y + height };
  } else if (minDist === distToLeft) {
    return { x: x, y: clampedY };
  } else {
    return { x: x + width, y: clampedY };
  }
}

/**
 * Find closest point on a line segment to a given point
 */
function closestPointOnLineSegment(point: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return a;

  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  return {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
}

/**
 * Calculate distance between two points
 */
function distanceBetween(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Update all arrows that are bound to a specific element
 */
export function updateBoundArrows(
  elements: ScribblElement[],
  movedElementId: string
): ScribblElement[] {
  const movedElement = elements.find(el => el.id === movedElementId);
  if (!movedElement) return elements;

  return elements.map(el => {
    // Only process lines and arrows
    if (el.type !== 'line' && el.type !== 'arrow') return el;

    const lineEl = el as LineElement | ArrowElement;
    let points = [...lineEl.points];
    let updated = false;

    // Update start point if bound to the moved element
    if (lineEl.startBinding?.elementId === movedElementId) {
      const newPoint = getBindingPoint(movedElement, lineEl.startBinding.focus, lineEl.startBinding.gap);
      // Convert to relative coordinates
      points[0] = { x: newPoint.x - lineEl.x, y: newPoint.y - lineEl.y };
      updated = true;
    }

    // Update end point if bound to the moved element
    if (lineEl.endBinding?.elementId === movedElementId) {
      const newPoint = getBindingPoint(movedElement, lineEl.endBinding.focus, lineEl.endBinding.gap);
      // Convert to relative coordinates
      points[points.length - 1] = { x: newPoint.x - lineEl.x, y: newPoint.y - lineEl.y };
      updated = true;
    }

    if (updated) {
      // Update the element with new points, then recalculate bounds
      const updatedElement = { ...lineEl, points } as LineElement | ArrowElement;
      return updateLineBounds(updatedElement) as ScribblElement;
    }

    return el;
  });
}

/**
 * Clear bindings that reference a deleted element
 */
export function clearBindingsForDeletedElement(
  elements: ScribblElement[],
  deletedElementId: string
): ScribblElement[] {
  return elements.map(el => {
    if (el.type !== 'line' && el.type !== 'arrow') return el;

    const lineEl = el as LineElement | ArrowElement;
    let updated = false;
    let startBinding = lineEl.startBinding;
    let endBinding = lineEl.endBinding;

    if (startBinding?.elementId === deletedElementId) {
      startBinding = null;
      updated = true;
    }

    if (endBinding?.elementId === deletedElementId) {
      endBinding = null;
      updated = true;
    }

    if (updated) {
      return { ...lineEl, startBinding, endBinding } as ScribblElement;
    }

    return el;
  });
}

/**
 * Clear all bindings from an arrow (when it's moved independently)
 */
export function clearArrowBindings(
  element: LineElement | ArrowElement
): LineElement | ArrowElement {
  return {
    ...element,
    startBinding: null,
    endBinding: null,
  };
}
