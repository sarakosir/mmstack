import { computed, Signal } from '@angular/core';
import { ColumnDef } from './column';
import { SortDirection, SortFeature } from './features';

export type Cell<U> = {
  name: string;
  value: Signal<U>;
};

export type HeaderFeatures = {
  sort: SortFeature
}

export type HeaderCell = Cell<string> & {
  features: {
    sort: {
      direction: Signal<SortDirection | null>
      toggleSort: () => void;
    }
  }
}



export function createCell<T, U>(
  source: Signal<T>,
  def: ColumnDef<T, U>,
): Cell<U> {
  return {
    name: def.name,
    value: computed(() => def.accessor(source()), def),
  };
}

export function createHeaderCell<T, U>(
  def: ColumnDef<T, U>,
  features: HeaderFeatures
): HeaderCell {
  return {
    name: def.name,
    value: computed(() => def.header?.() ?? ''),
    features: {
      sort: {
        direction: computed(() => {
          const sort = features.sort.state();
          if (sort?.name !== def.name) return null;
          return sort.direction;
        }),
        toggleSort: () => features.sort.toggleSort(def.name)
      }
    }
  };
}

export function createFooterCell<T, U>(def: ColumnDef<T, U>): Cell<string> {
  return {
    name: def.name,
    value: computed(() => def.footer?.() ?? ''),
  };
}
