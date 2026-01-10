import type { ScribblElement, Point } from '@/types';

export interface SnapPoint {
  x: number;
  y: number;
  type: 'center' | 'edge' | 'corner';
  elementId: string;
}

const SNAP_THRESHOLD = 15;

export function getSnapPointsForElement(element: ScribblElement): SnapPoint[] {
  if (element.isDeleted) return [];

  const { x, y, width, height, id } = element;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const points: SnapPoint[] = [];

  switch (element.type) {
    case 'rectangle':
    case 'text':
    case 'image':
      // Corners
      points.push({ x, y, type: 'corner', elementId: id });
      points.push({ x: x + width, y, type: 'corner', elementId: id });
      points.push({ x: x + width, y: y + height, type: 'corner', elementId: id });
      points.push({ x, y: y + height, type: 'corner', elementId: id });
      // Edge centers
      points.push({ x: cx, y, type: 'edge', elementId: id });
      points.push({ x: x + width, y: cy, type: 'edge', elementId: id });
      points.push({ x: cx, y: y + height, type: 'edge', elementId: id });
      points.push({ x, y: cy, type: 'edge', elementId: id });
      // Center
      points.push({ x: cx, y: cy, type: 'center', elementId: id });
      break;

    case 'ellipse':
      // Edge points (cardinal directions)
      points.push({ x: cx, y, type: 'edge', elementId: id });
      points.push({ x: x + width, y: cy, type: 'edge', elementId: id });
      points.push({ x: cx, y: y + height, type: 'edge', elementId: id });
      points.push({ x, y: cy, type: 'edge', elementId: id });
      // Center
      points.push({ x: cx, y: cy, type: 'center', elementId: id });
      break;

    case 'diamond':
      // Diamond points (4 corners rotated 45 degrees)
      points.push({ x: cx, y, type: 'corner', elementId: id }); // top
      points.push({ x: x + width, y: cy, type: 'corner', elementId: id }); // right
      points.push({ x: cx, y: y + height, type: 'corner', elementId: id }); // bottom
      points.push({ x, y: cy, type: 'corner', elementId: id }); // left
      // Center
      points.push({ x: cx, y: cy, type: 'center', elementId: id });
      break;
  }

  return points;
}

export function findNearestSnapPoint(
  point: Point,
  elements: ScribblElement[],
  excludeIds: string[] = []
): SnapPoint | null {
  let nearestPoint: SnapPoint | null = null;
  let nearestDistance = SNAP_THRESHOLD;

  elements.forEach(element => {
    if (excludeIds.includes(element.id)) return;

    const snapPoints = getSnapPointsForElement(element);
    snapPoints.forEach(snapPoint => {
      const distance = Math.sqrt(
        Math.pow(point.x - snapPoint.x, 2) + Math.pow(point.y - snapPoint.y, 2)
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPoint = snapPoint;
      }
    });
  });

  return nearestPoint;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export function getAlignmentGuides(
  movingElement: ScribblElement,
  elements: ScribblElement[],
  threshold = 5
): { guides: AlignmentGuide[]; snapX: number | null; snapY: number | null } {
  const guides: AlignmentGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const movingBox = {
    left: movingElement.x,
    right: movingElement.x + movingElement.width,
    top: movingElement.y,
    bottom: movingElement.y + movingElement.height,
    centerX: movingElement.x + movingElement.width / 2,
    centerY: movingElement.y + movingElement.height / 2,
  };

  elements.forEach(element => {
    if (element.id === movingElement.id || element.isDeleted) return;

    const box = {
      left: element.x,
      right: element.x + element.width,
      top: element.y,
      bottom: element.y + element.height,
      centerX: element.x + element.width / 2,
      centerY: element.y + element.height / 2,
    };

    // Vertical alignments (x-axis)
    const verticalChecks = [
      { moving: movingBox.left, target: box.left },
      { moving: movingBox.left, target: box.centerX },
      { moving: movingBox.left, target: box.right },
      { moving: movingBox.centerX, target: box.left },
      { moving: movingBox.centerX, target: box.centerX },
      { moving: movingBox.centerX, target: box.right },
      { moving: movingBox.right, target: box.left },
      { moving: movingBox.right, target: box.centerX },
      { moving: movingBox.right, target: box.right },
    ];

    verticalChecks.forEach(({ moving, target }) => {
      if (Math.abs(moving - target) < threshold) {
        if (snapX === null || Math.abs(moving - target) < Math.abs(moving - snapX)) {
          snapX = target;
        }
        guides.push({
          type: 'vertical',
          position: target,
          start: Math.min(movingBox.top, box.top),
          end: Math.max(movingBox.bottom, box.bottom),
        });
      }
    });

    // Horizontal alignments (y-axis)
    const horizontalChecks = [
      { moving: movingBox.top, target: box.top },
      { moving: movingBox.top, target: box.centerY },
      { moving: movingBox.top, target: box.bottom },
      { moving: movingBox.centerY, target: box.top },
      { moving: movingBox.centerY, target: box.centerY },
      { moving: movingBox.centerY, target: box.bottom },
      { moving: movingBox.bottom, target: box.top },
      { moving: movingBox.bottom, target: box.centerY },
      { moving: movingBox.bottom, target: box.bottom },
    ];

    horizontalChecks.forEach(({ moving, target }) => {
      if (Math.abs(moving - target) < threshold) {
        if (snapY === null || Math.abs(moving - target) < Math.abs(moving - snapY)) {
          snapY = target;
        }
        guides.push({
          type: 'horizontal',
          position: target,
          start: Math.min(movingBox.left, box.left),
          end: Math.max(movingBox.right, box.right),
        });
      }
    });
  });

  // Deduplicate guides
  const uniqueGuides = guides.filter((guide, index, self) =>
    index === self.findIndex(g =>
      g.type === guide.type &&
      Math.abs(g.position - guide.position) < 1
    )
  );

  return { guides: uniqueGuides, snapX, snapY };
}

export function renderAlignmentGuides(
  ctx: CanvasRenderingContext2D,
  guides: AlignmentGuide[],
  zoom: number,
  scrollX: number,
  scrollY: number
) {
  ctx.save();
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  guides.forEach(guide => {
    ctx.beginPath();
    if (guide.type === 'vertical') {
      const x = guide.position * zoom + scrollX;
      ctx.moveTo(x, guide.start * zoom + scrollY);
      ctx.lineTo(x, guide.end * zoom + scrollY);
    } else {
      const y = guide.position * zoom + scrollY;
      ctx.moveTo(guide.start * zoom + scrollX, y);
      ctx.lineTo(guide.end * zoom + scrollX, y);
    }
    ctx.stroke();
  });

  ctx.restore();
}

export function renderSnapPoints(
  ctx: CanvasRenderingContext2D,
  snapPoints: SnapPoint[],
  zoom: number,
  scrollX: number,
  scrollY: number
) {
  ctx.save();

  snapPoints.forEach(point => {
    const x = point.x * zoom + scrollX;
    const y = point.y * zoom + scrollY;

    ctx.fillStyle = point.type === 'center' ? '#ff6b6b' : '#4dabf7';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.restore();
}
