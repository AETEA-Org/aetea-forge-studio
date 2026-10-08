/** Shared canvas geometry + fixture-position persistence (localStorage). */

export interface XY {
  x: number;
  y: number;
}

export interface FixturePositions {
  detail: XY;
  chat: XY & { width?: number; height?: number };
  keyVisual: XY;
}

export const OBJECT_DEFAULT_WIDTH = 300;
export const OBJECT_DEFAULT_HEIGHT = 240;

export const CHAT_DEFAULT_SIZE = { width: 400, height: 520 };

export const KEY_VISUAL_SIZE = { width: 260, height: 260 };

const DEFAULT_FIXTURES: FixturePositions = {
  detail: { x: 40, y: 40 },
  chat: { x: 40, y: 380 },
  keyVisual: { x: 400, y: 40 },
};

export interface Rect extends XY {
  width: number;
  height: number;
}

const GRID_ORIGIN = { x: 480, y: 320 };
const GRID_PITCH = { x: 340, y: 300 };
const GRID_COLUMNS = 3;
/** Enough rows that `findFreeSlot` always terminates; it stacks past the last. */
const GRID_MAX_ROWS = 60;

/** The slot a card would take if nothing else were on the canvas. */
function gridSlot(index: number): XY {
  const col = index % GRID_COLUMNS;
  const row = Math.floor(index / GRID_COLUMNS);
  return {
    x: GRID_ORIGIN.x + col * GRID_PITCH.x,
    y: GRID_ORIGIN.y + row * GRID_PITCH.y,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Where to drop a card that has never been placed.
 *
 * The grid alone is not enough, and that was the bug: slots were assigned from
 * a card's position in the list and compared against nothing, so a new card
 * landed on its slot whether or not something was already sitting there. Once
 * any card had been dragged — which is the normal state of a canvas somebody
 * has tidied — its real position had nothing to do with the grid, and the next
 * card to arrive could be dropped straight on top of it. On the 2026-10-08
 * canvas that put a new image 143px over a key visual, every time, because it
 * is arithmetic rather than a race.
 *
 * So the grid is still where cards prefer to go; `occupied` is what stops them
 * going there when something else got there first. Pass every rectangle already
 * on the board — the fixtures too, not only other cards.
 *
 * Past the last row it gives up and stacks, which is deliberate: a canvas with
 * sixty cards has a different problem and silently searching forever is worse
 * than a visible pile.
 */
export function findFreeSlot(size: { width: number; height: number }, occupied: Rect[]): XY {
  for (let index = 0; index < GRID_COLUMNS * GRID_MAX_ROWS; index += 1) {
    const slot = gridSlot(index);
    const candidate = { ...slot, width: size.width, height: size.height };
    if (!occupied.some((taken) => overlaps(candidate, taken))) return slot;
  }
  return gridSlot(GRID_COLUMNS * GRID_MAX_ROWS - 1);
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
      chat: {
        ...(parsed.chat ?? DEFAULT_FIXTURES.chat),
        width: Number.isFinite(parsed.chat?.width) ? Math.max(320, parsed.chat!.width!) : CHAT_DEFAULT_SIZE.width,
        height: Number.isFinite(parsed.chat?.height) ? Math.max(300, parsed.chat!.height!) : CHAT_DEFAULT_SIZE.height,
      },
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
