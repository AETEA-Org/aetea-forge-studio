/** Shared canvas geometry + fixture-position persistence (localStorage). */

export interface XY {
  x: number;
  y: number;
}

export interface FixturePositions {
  detail: XY;
  chat: XY;
  keyVisual: XY;
}

export const OBJECT_DEFAULT_WIDTH = 300;
export const OBJECT_DEFAULT_HEIGHT = 240;

export const KEY_VISUAL_SIZE = { width: 260, height: 260 };

const DEFAULT_FIXTURES: FixturePositions = {
  detail: { x: 40, y: 40 },
  chat: { x: 40, y: 380 },
  keyVisual: { x: 400, y: 40 },
};

/** Cascade unplaced objects into a grid to the right of the fixtures. */
export function autoObjectPosition(index: number): XY {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: 480 + col * 340, y: 320 + row * 300 };
}

function fixtureStorageKey(taskId: string): string {
  return `aetea:canvas-fixtures:${taskId}`;
}

export function loadFixturePositions(taskId: string): FixturePositions {
  try {
    const raw = localStorage.getItem(fixtureStorageKey(taskId));
    if (!raw) return DEFAULT_FIXTURES;
    const parsed = JSON.parse(raw) as Partial<FixturePositions>;
    return {
      detail: parsed.detail ?? DEFAULT_FIXTURES.detail,
      chat: parsed.chat ?? DEFAULT_FIXTURES.chat,
      keyVisual: parsed.keyVisual ?? DEFAULT_FIXTURES.keyVisual,
    };
  } catch {
    return DEFAULT_FIXTURES;
  }
}

export function saveFixturePositions(taskId: string, positions: FixturePositions): void {
  try {
    localStorage.setItem(fixtureStorageKey(taskId), JSON.stringify(positions));
  } catch {
    /* ignore storage errors (private mode, quota) */
  }
}
