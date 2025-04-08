import { isDevMode, Signal, WritableSignal } from '@angular/core';

export type SortDirection   = 'asc' | 'desc';

export type SortState = {
  name: string;
  direction: SortDirection;
} | null;


export type SortFeature = {
  state: Signal<SortState>;
  sort: (name: string, direction: SortDirection) => void;
  toggleSort: (name: string) => void;
  clearSort: () => void;
}


function nextSortDirection(current?: SortDirection): SortDirection | null {
  if (!current) return "asc";
  if (current === 'asc') return 'desc';
  return null;
}

export function mergeSortState(sort?: Partial<SortState>): SortState {
  if (!sort) return null;
  if (!sort.name) {
    if (isDevMode()) console.warn("Sort name is required in initial sort state");
    return null;
  }

  return {
    name: sort.name,
    direction: sort.direction ?? 'asc'
  }
}


export function createSortState(
  state: WritableSignal<SortState>
): SortFeature {

  return {
    state,
    clearSort: () => state.set(null),
    sort: (name: string, direction: SortDirection) => state.set({
      name,
      direction
    }),
    toggleSort: (name: string) => state.update((cur) => {
      const next = nextSortDirection(cur?.name === name ? cur.direction : undefined);
      if (next === null) return null;

      return {
        name,
        direction: next
      }
    })
  }
}

