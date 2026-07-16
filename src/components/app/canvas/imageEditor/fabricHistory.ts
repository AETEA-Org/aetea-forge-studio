import type { Canvas } from "fabric";

const MAX_STATES = 30;

/** Undo/redo stack using Fabric canvas JSON snapshots. */
export class FabricHistory {
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  reset(canvas: Canvas): void {
    this.undoStack = [JSON.stringify(canvas.toJSON())];
    this.redoStack = [];
  }

  push(canvas: Canvas): void {
    const json = JSON.stringify(canvas.toJSON());
    const last = this.undoStack[this.undoStack.length - 1];
    if (last === json) return;
    this.undoStack.push(json);
    if (this.undoStack.length > MAX_STATES) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  async undo(canvas: Canvas): Promise<boolean> {
    if (!this.canUndo()) return false;
    const current = this.undoStack.pop();
    if (current) this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    if (!prev) return false;
    await canvas.loadFromJSON(JSON.parse(prev));
    canvas.requestRenderAll();
    return true;
  }

  async redo(canvas: Canvas): Promise<boolean> {
    if (!this.canRedo()) return false;
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(next);
    await canvas.loadFromJSON(JSON.parse(next));
    canvas.requestRenderAll();
    return true;
  }
}
