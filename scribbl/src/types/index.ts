export type Tool =
  | 'selection'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'freedraw'
  | 'text'
  | 'image'
  | 'pan';

export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'freedraw'
  | 'text'
  | 'image';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: 'solid' | 'hachure' | 'cross-hatch';
  strokeWidth: number;
  roughness: number;
  opacity: number;
  groupId: string | null;
  isDeleted: boolean;
  seed: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: Point[];
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: Point[];
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
}

export interface FreedrawElement extends BaseElement {
  type: 'freedraw';
  points: Point[];
  pressures: number[];
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'Virgil' | 'Helvetica' | 'Cascadia';
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  fileId: string;
  scale: [number, number];
}

export type ScribblElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | LineElement
  | ArrowElement
  | FreedrawElement
  | TextElement
  | ImageElement;

export interface AppState {
  tool: Tool;
  selectedElementIds: Record<string, boolean>;
  zoom: number;
  scrollX: number;
  scrollY: number;
  currentColor: string;
  currentBackgroundColor: string;
  currentStrokeWidth: number;
  currentFillStyle: 'solid' | 'hachure' | 'cross-hatch';
  currentRoughness: number;
  currentOpacity: number;
  showGrid: boolean;
  gridSize: number;
  isDrawing: boolean;
  isPanning: boolean;
  cursorPosition: Point | null;
}

export interface HistoryState {
  elements: ScribblElement[];
  appState: Partial<AppState>;
}

export const COLORS = {
  transparent: 'transparent',
  black: '#1e1e1e',
  white: '#ffffff',
  red: '#e03131',
  pink: '#c2255c',
  grape: '#9c36b5',
  violet: '#6741d9',
  indigo: '#3b5bdb',
  blue: '#1971c2',
  cyan: '#0c8599',
  teal: '#099268',
  green: '#2f9e44',
  lime: '#66a80f',
  yellow: '#f08c00',
  orange: '#e8590c',
} as const;

export const DEFAULT_ELEMENT_PROPS = {
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

export const DEFAULT_APP_STATE: AppState = {
  tool: 'selection',
  selectedElementIds: {},
  zoom: 1,
  scrollX: 0,
  scrollY: 0,
  currentColor: COLORS.black,
  currentBackgroundColor: COLORS.transparent,
  currentStrokeWidth: 2,
  currentFillStyle: 'hachure',
  currentRoughness: 1,
  currentOpacity: 100,
  showGrid: false,
  gridSize: 20,
  isDrawing: false,
  isPanning: false,
  cursorPosition: null,
};
