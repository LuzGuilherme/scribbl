import type { ScribblElement } from '@/types';

export interface HistoryEntry {
  elements: ScribblElement[];
  timestamp: number;
}

export class History {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(elements: ScribblElement[]) {
    // Deep clone elements to prevent reference issues
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)),
      timestamp: Date.now(),
    };

    this.undoStack.push(entry);

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(currentElements: ScribblElement[]): ScribblElement[] | null {
    if (this.undoStack.length === 0) return null;

    // Save current state to redo stack
    this.redoStack.push({
      elements: JSON.parse(JSON.stringify(currentElements)),
      timestamp: Date.now(),
    });

    // Pop and return previous state
    const entry = this.undoStack.pop()!;
    return entry.elements;
  }

  redo(currentElements: ScribblElement[]): ScribblElement[] | null {
    if (this.redoStack.length === 0) return null;

    // Save current state to undo stack
    this.undoStack.push({
      elements: JSON.parse(JSON.stringify(currentElements)),
      timestamp: Date.now(),
    });

    // Pop and return redo state
    const entry = this.redoStack.pop()!;
    return entry.elements;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}

// Singleton instance for global history management
let globalHistory: History | null = null;

export function getHistory(): History {
  if (!globalHistory) {
    globalHistory = new History();
  }
  return globalHistory;
}

export function resetHistory() {
  globalHistory = new History();
}
