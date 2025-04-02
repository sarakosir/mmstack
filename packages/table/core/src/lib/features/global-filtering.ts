import { createStringState, StringState } from '@mmstack/form-adapters';
import { TableState } from '../table';
import { WritableSignal } from '@angular/core';
import { derived } from '@mmstack/primitives';

export type GlobalFilteringFeature = StringState<TableState>

export type GlobalFilteringState = string;

export type GlobalFilteringOptions = {
  label?: () => string;
}


export function createGlobalFilter(state: WritableSignal<TableState>, opt?: GlobalFilteringOptions): GlobalFilteringFeature {
  const filter = createStringState(derived(state, 'globalFilter'), {
    label: () => opt?.label?.() ?? 'Search',
  })
  return filter;
}
