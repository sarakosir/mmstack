import { type HttpHeaders, type HttpResourceRef } from '@angular/common/http';
import {
  linkedSignal,
  type Signal,
  type ValueEqualityFn,
  type WritableSignal,
} from '@angular/core';

function presist<T>(
  value: WritableSignal<T>,
  usePrevious: Signal<boolean>,
  equal?: ValueEqualityFn<T>,
): WritableSignal<T>;

function presist<T>(
  value: Signal<T>,
  usePrevious: Signal<boolean>,
  equal?: ValueEqualityFn<T>,
): Signal<T>;

function presist<T>(
  value: WritableSignal<T> | Signal<T>,
  usePrevious: Signal<boolean>,
  equal?: ValueEqualityFn<T>,
): WritableSignal<T> | Signal<T> {
  // linkedSignal allows us to access previous source value

  const persisted = linkedSignal<
    {
      value: T;
      usePrevious: boolean;
    },
    T
  >({
    source: () => {
      return {
        value: value(),
        usePrevious: usePrevious(),
      };
    },
    computation: (source, prev) => {
      if (source.usePrevious && prev) return prev.value;

      return source.value;
    },
    equal,
  });

  // if original value was WritableSignal then override linkedSignal methods to original...angular uses linkedSignal under the hood in ResourceImpl, this applies to that.
  if ('set' in value) {
    persisted.set = value.set;
    persisted.update = value.update;
    persisted.asReadonly = value.asReadonly;
  }

  return persisted;
}

export function persistResourceValues<T>(
  resource: HttpResourceRef<T>,
  persist = false,
  equal?: ValueEqualityFn<T>,
): HttpResourceRef<T> {
  if (!persist) return resource;

  return {
    ...resource,
    statusCode: presist<number | undefined>(
      resource.statusCode,
      resource.isLoading,
    ),
    headers: presist<HttpHeaders | undefined>(
      resource.headers,
      resource.isLoading,
    ),
    value: presist<T>(resource.value, resource.isLoading, equal),
  };
}
