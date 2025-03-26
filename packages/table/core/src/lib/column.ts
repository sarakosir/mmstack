import { Signal } from '@angular/core';

export type SharedColumnState = {
  align: Signal<'left' | 'right'>;
  name: string;
  show: Signal<boolean>;
  toggleVisibility: () => void;
};
