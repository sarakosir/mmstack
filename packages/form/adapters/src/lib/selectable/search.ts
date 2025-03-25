import { HttpResourceRequest } from '@angular/common/http';
import { Signal, WritableSignal } from '@angular/core';
import {
  CreateFormControlOptions,
  FormControlSignal,
} from '@mmstack/form-core';
import { QueryResourceOptions } from '@mmstack/resource';

export type SearchState<T, TParent = undefined> = FormControlSignal<
  T,
  TParent
> & {
  placeholder: Signal<string>;
  searchPlaceholder: Signal<string>;
  identify: Signal<(item: NoInfer<T>) => string>;
  displayWith: Signal<(item: NoInfer<T>) => string>;
  disableOption: Signal<(item: NoInfer<T>) => boolean>;
  query: WritableSignal<string>;
  toRequest: Signal<(query: string) => HttpResourceRequest>;
  resourceOptions: QueryResourceOptions<T[]>;
  panelWidth: Signal<string | number | null>;
  type: 'search';
};

export type SearchStateOptions<
  T,
  TParent = undefined,
> = CreateFormControlOptions<T, 'control'> & {
  placeholder?: () => string;
  searchPlaceholder?: () => string;
  identify?: () => (item: NoInfer<T>) => string;
  displayWith?: () => (item: NoInfer<T>) => string;
  disableOption?: () => (item: NoInfer<T>) => boolean;
  toRequest: () => (query: string) => HttpResourceRequest;
  panelWidth?: () => string | number | null;
  onSelected?: (value: T) => void;
  resourceOptions?: QueryResourceOptions<T[]>;
};
