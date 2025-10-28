/**
 * Generic undo/redo stack for bulk and destructive actions.
 */

export interface UndoableAction<T> {
  state: T;
  description: string;
  timestamp: Date;
}

/**
 * Generic undo/redo manager for state management.
 * Supports history navigation and action tracking.
 */
export class UndoManager<T> {
  private stack: UndoableAction<T>[] = [];
  private pointer: number = -1;
  private maxSize: number;

  /**
   * Create a new UndoManager.
   *
   * @param maxSize - Maximum number of states to keep in history (default: 50)
   */
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Push a new state onto the stack.
   * Clears any redo history after current pointer.
   *
   * @param state - The state to save
   * @param description - Optional description of the action
   */
  push(state: T, description = 'Action'): void {
    // Remove any redo history
    this.stack = this.stack.slice(0, this.pointer + 1);

    // Add new state
    this.stack.push({
      state,
      description,
      timestamp: new Date(),
    });

    // Maintain max size
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    } else {
      this.pointer += 1;
    }
  }

  /**
   * Undo to previous state.
   *
   * @returns Previous state or undefined if at beginning
   */
  undo(): T | undefined {
    if (this.pointer > 0) {
      this.pointer -= 1;
      return this.stack[this.pointer].state;
    }
    return undefined;
  }

  /**
   * Redo to next state.
   *
   * @returns Next state or undefined if at end
   */
  redo(): T | undefined {
    if (this.pointer < this.stack.length - 1) {
      this.pointer += 1;
      return this.stack[this.pointer].state;
    }
    return undefined;
  }

  /**
   * Get current state without changing pointer.
   *
   * @returns Current state or undefined if stack is empty
   */
  current(): T | undefined {
    if (this.pointer >= 0 && this.pointer < this.stack.length) {
      return this.stack[this.pointer].state;
    }
    return undefined;
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.pointer > 0;
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  /**
   * Get description of action that would be undone.
   */
  getUndoDescription(): string | undefined {
    if (this.canUndo() && this.pointer > 0) {
      return this.stack[this.pointer].description;
    }
    return undefined;
  }

  /**
   * Get description of action that would be redone.
   */
  getRedoDescription(): string | undefined {
    if (this.canRedo() && this.pointer < this.stack.length - 1) {
      return this.stack[this.pointer + 1].description;
    }
    return undefined;
  }

  /**
   * Get full history.
   */
  getHistory(): UndoableAction<T>[] {
    return [...this.stack];
  }

  /**
   * Get current position in history.
   */
  getPosition(): number {
    return this.pointer;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.stack = [];
    this.pointer = -1;
  }

  /**
   * Jump to specific point in history.
   *
   * @param index - Index to jump to
   * @returns State at that index or undefined if invalid
   */
  jumpTo(index: number): T | undefined {
    if (index >= 0 && index < this.stack.length) {
      this.pointer = index;
      return this.stack[index].state;
    }
    return undefined;
  }

  /**
   * Get size of history.
   */
  size(): number {
    return this.stack.length;
  }
}

/**
 * Hook-friendly wrapper for UndoManager in React components.
 */
export function createUndoManager<T>(initialState?: T, maxSize = 50): UndoManager<T> {
  const manager = new UndoManager<T>(maxSize);

  if (initialState !== undefined) {
    manager.push(initialState, 'Initial state');
  }

  return manager;
}
