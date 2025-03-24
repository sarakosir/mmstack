# Fun-grained Reactivity in Angular: Part 1 – Primitives

This post was originally made on our company's blog in May 2024. I'm reposting it here, so that the series can be continued seamlessly :)

---

In the ancient past of 2023 Angular’s v16 brought signal primitives to the framework, starting the path towards a future of fine-grained reactivity. I won’t waste either of our times here by explaining the benefits of signal-based reactivity as there’s already a bunch of great articles on that topic, needless to say, we’re fully on-board with this change here at Marand.
In this series we’ll endeavor to evolve several existing parts of angular, namely forms (NgModel/FormControl) & http (HttpClient) into a more signal-y future. To start that journey, we’ll first need to develop some core primitives that will help us along the way.

## Mutability & Recycling

Back in the dev. preview version of Signals they had 3 main functions that allowed us to change the value (set, update & mutate).
We found mutate very useful, since one of the main benefits of signals is the aspect of their increased performance. Of course, immutability tends to be easier to reason about & is why most frameworks have focused on it so much, but there are lots of occasions where say de-structuring an array is just needlessly creating GC calls, never mind that under the hood things like memcpy still have a cost. Also, and this may just be me, but I've seen too many videos by [ThePrimeagen](https://www.youtube.com/@ThePrimeagen) to not get a "funny" feeling whenever I destructure an array or re-build a set just to force a re-render. :)

Sadly, this was removed in ng17 with the full release of signals, enforcing immutability, likewise the optional equality function was of no help since if the object was mutated in-line both a & b were the same when the function was called & angular even through an error if you force returned true within it for the same object reference. We we’re able to “hack” by messing around with epochs and whatnot hidden within the SIGNAL symbol but it wasn’t a good solution. Lucky for us they removed that error somewhere around 17.0.6, I assume due to the at-the-time upcoming model signal. This allows us to cleanly add this functionality back in. :)

```typescript
import { ValueEqualityFn, WritableSignal, signal } from '@angular/core';

const { is } = Object;

export type MutableSignal<T> = WritableSignal<T> & {
  mutate: WritableSignal<T>['update'];
};

export function mutable<T>(initial: T, opts?: { equal?: ValueEqualityFn<T> }) {
  const baseEqual = opts?.equal ?? is;
  let trigger = false;

  const equal: ValueEqualityFn<T> = (a, b) => {
    if (trigger) return false;
    return baseEqual(a, b);
  };

  const sig = signal(initial, { equal }) as MutableSignal<T>;
  sig.mutate = (fn: (v: T) => T) => {
    trigger = true;
    sig.update(fn);
    trigger = false;
  };

  return sig;
}
```

This allows us to mutate objects in-line & will serve as the core building block we build upon. It's easy enough to test out if we compare the outputs of an effect that triggers when its value changes:

```typescript
import { mutable } from './mutable';
import { signal, effect } from '@angular/core';

const base = signal([1, 2, 3]);
const mut = mutable([1, 2, 3]);

setTimeout(() => {
  base.update((cur) => {
    cur.push(4);
    return cur;
  });
  mut.mutate((cur) => {
    cur.push(4);
    return cur;
  });
});

effect(() => {
  console.log(base()); // logs [1, 2, 3]
});

effect(() => {
  console.log(mut()); // logs [1, 2, 3] then [1, 2, 3, 4]
});
```

As with everything mutability/immutability have their places, we're just giving ourselves back that choice. :)

## Stores

Now we're going to start looking for inspiration from other frameworks & libraries like SolidJS, it is after all the most mature signal-based framework out there & can serve as a great source of inspiration for what the future of Angular's fine-grained reactivity will look like. First up, we'll look at stores.

You can check out Solid's version of stores [here](https://docs.solidjs.com/concepts/stores). Essentially, they are a way to encapsulate more complex state like objects.

```typescript
import { ValueEqualityFn, WritableSignal } from '@angular/core';
import { mutable } from './mutable';

type StoreKey<T> = T extends object ? keyof T : never;

type StorePath<T> = T extends object ? [StoreKey<T>, ...StorePath<T[StoreKey<T>]>] : [];

type ResolvePathType<T, Path extends StorePath<T>> = Path extends []
  ? T // Base case:  Empty path, type is just T itself
  : Path extends [infer K, ...infer Rest]
    ? K extends keyof T
      ? Rest extends StorePath<T[K]> // Recurse if K is a key of T
        ? ResolvePathType<T[K], Rest>
        : never
      : never // Handle keys invalid for T
    : never;

type SignalStore<T> = WritableSignal<T> & {
  updateProp<K extends StorePath<T>>(path: K, value: ResolvePathType<T, K>): void;
};

export function store<T>(value: T, opt?: { equal: ValueEqualityFn<T> }): SignalStore<T> {
  const sig = mutable(value, opt);

  (sig as WritableSignal<T> as SignalStore<T>).updateProp = (path, value) => {
    sig.mutate((state) => {
      let obj = state as any;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path.at(-1)] = value;

      return state;
    });
  };

  return sig as WritableSignal<T> as SignalStore<T>;
}
```

Due to our use of mutable under the hood we can modify the state in-place, while triggering the signal to update. We could also create a completely immutable version of this that destructures every object in the path, but I like to keep things as performant as possible. :)

There's also a bit of complicated typescript there but it just serves for accurate type inference when using the stores updateProp method. Here's how we could use it:

```typescript
import { store } from './store';

const test = store({ a: { b: 1 }, c: 2 });

effect(() => {
  console.log(test().a.b); // logs 1 & will log every time any attribute or the object itself changes
});
```

This is nice, but it has a problem, the effect will trigger even when c changes, which is fine if we want that, but we should allow for more granular control. To achieve this we need to introduce store slices to the mix.

```typescript
import { ValueEqualityFn, WritableSignal, computed } from '@angular/core';
import { MutableSignal, mutable } from './mutable';

type StoreKey<T> = T extends object ? keyof T : never;

type StorePath<T> = T extends object ? [StoreKey<T>, ...StorePath<T[StoreKey<T>]>] : [];

type ResolvePathType<T, Path extends StorePath<T>> = Path extends []
  ? T // Base case:  Empty path, type is just T itself
  : Path extends [infer K, ...infer Rest]
    ? K extends keyof T
      ? Rest extends StorePath<T[K]>
        ? ResolvePathType<T[K], Rest>
        : never
      : never // Handle keys invalid for T
    : never;

type AssignableSignalStore<T> = MutableSignal<T> & {
  updateProp<K extends StorePath<T>>(path: K, value: ResolvePathType<T, K>): void;
};

export type SignalStore<T> = WritableSignal<T> & {
  updateProp<K extends StorePath<T>>(path: K, value: ResolvePathType<T, K>): void;
};

function createPropUpdater<T>(sig: MutableSignal<T>) {
  return <K extends StorePath<T>>(path: StorePath<T>, value: ResolvePathType<T, K>) => {
    sig.mutate((state) => {
      let obj = state as any;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path.at(-1)] = value;
      return state;
    });
  };
}

function createStore<T>(value: T, opt?: { equal: ValueEqualityFn<T> }) {
  const sig = mutable(value, opt) as AssignableSignalStore<T>;
  sig.updateProp = createPropUpdater(sig);
  return sig;
}

export function store<T>(value: T, opt?: { equal: ValueEqualityFn<T> }): SignalStore<T> {
  return createStore(value, opt);
}

export type SlicedStore<T> = SignalStore<T> & {
  slices: {
    [K in keyof T]: Slice<T[K]>;
  };
};

type AssignableSlicedStore<T> = AssignableSignalStore<T> & {
  slices: {
    [K in keyof T]: AssignableSlice<T[K]>;
  };
};

type Slice<T> = T extends object ? (T extends null ? WritableSignal<T> : SlicedStore<T>) : WritableSignal<T>;
type AssignableSlice<T> = T extends object ? (T extends null ? MutableSignal<T> : AssignableSlicedStore<T>) : MutableSignal<T>;

function keys<T extends object>(obj: T): (keyof T)[] {
  if (!obj) return [];
  return Object.keys(obj) as (keyof T)[];
}

function slicedStoreWithParent<T extends object, K extends keyof T>(parentStore: AssignableSlicedStore<T>, key: K) {
  const value = parentStore()[key];
  if (typeof value !== 'object' || value === null) return null;

  const sig = computed(() => parentStore()[key]) as AssignableSlicedStore<typeof value>;

  sig.set = (value) => {
    parentStore.mutate((state) => {
      state[key] = value;
      return state;
    });
  };

  sig.update = (fn) => sig.set(fn(sig()));
  sig.mutate = (fn) => sig.set(fn(sig()));
  sig.updateProp = createPropUpdater(sig);

  sig.slices = keys(value).reduce(
    (acc, key) => {
      const sigVal = sig()[key];

      if (typeof sigVal === 'object' && sigVal !== null) {
        const subStore = slicedStoreWithParent(sig, key);
        if (subStore) acc[key] = subStore as (typeof acc)[typeof key];
        return acc;
      }

      const propSig = computed(() => sig()[key]) as AssignableSlice<typeof sigVal>;
      propSig.set = (value: typeof sigVal) => {
        sig.mutate((state) => {
          state[key] = value;
          return state;
        });
      };
      propSig.update = (fn: any) => propSig.set(fn(propSig()));
      propSig.mutate = (fn: any) => propSig.set(fn(propSig()));
      acc[key] = propSig as (typeof acc)[typeof key];

      return acc;
    },
    {} as typeof sig.slices,
  );

  return sig;
}

export function slicedStore<T extends object>(value: T, opt?: { equal: ValueEqualityFn<T> }): SlicedStore<T> {
  const sig = mutable(value, opt) as AssignableSlicedStore<T>;
  sig.updateProp = createPropUpdater(sig);

  sig.slices = keys(value).reduce(
    (acc, key) => {
      const sigVal = sig()[key];

      if (typeof sigVal === 'object' && sigVal !== null) {
        const subStore = slicedStoreWithParent(sig, key);
        if (subStore) acc[key] = subStore as (typeof acc)[typeof key];
        return acc;
      }

      const propSig = computed(() => sig()[key]) as AssignableSlice<typeof sigVal>;
      propSig.set = (value: typeof sigVal) => {
        sig.mutate((state) => {
          state[key] = value;
          return state;
        });
      };
      propSig.update = (fn: any) => propSig.set(fn(propSig()));
      propSig.mutate = (fn: any) => propSig.set(fn(propSig()));
      acc[key] = propSig as (typeof acc)[typeof key];

      return acc;
    },
    {} as typeof sig.slices,
  );

  return sig;
}
```

The main diference to the "core" code of the store here is some additional abstraction to avoid code duplication, we've however now added slices to the mix by creating computeds & mapping their set/update/mutate methods so that they correctly update the parent store. This will still therefore trigger the parents effect as seen above but we can now access specific computed values, that only trigger when their equality check changes. As we're modifying stuff in-place, these should change when we update a specific slice. Adding set/update/mutate to the slices may seem weird now, since we dont really need them, but they will be useful when we start building signal based forms. If you sort-of squint, you can maybe see how a sliced store could replace a FormGroup in the future, or at least provide a building block for it.

```typescript
import { store } from './store';

const test = store({ a: { b: 1 }, c: 2 });

effect(() => {
  console.log(test().c); // same as above logs any time anything changes
});

effect(() => {
  console.log(test.slices.c()); // only logs when c changes
});
```

Creating a lot of computed values up-front may seem like a waste, but beyond some added cost when instantiating the store it shouldn't affect anything since unlike Solid, Angular's computeds are evaluated lazily (when they are subscribed to). Here's a quick example:

```typescript
// Solid
function App() {
  const [count, setCount] = createSignal(1)
  const double = createMemo(() => {
    console.log('computing') // logs even though it's never used
    return count() * 2
  })

  return (
    <>
      {count()}
    </>
  )
}
// Angular
@Component({
  ...,
  template: `{{count()}}`
})
export class AppComponent {
  count = signal(1);
  double = computed(() => {
    console.log('computing'); // never logs
    return this.count() * 2;
  });
}
```

## Resources & Suspense

Resources are a core SolidJS primitive used for asynchronous data. While Angular already has a way of handling async data through RxJs Observables, we can still do some cool stuff by taking inspiration from Solid. Ideally we'd want to have an easy-to-use primitive so that we can soften the learning curve for new Angular developers. Anyway here's a basic implementation:

```typescript
import { Signal, ValueEqualityFn, WritableSignal, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, isObservable, of, switchMap, tap } from 'rxjs';
import { MutableSignal, mutable } from './mutable';

type AssignableResource<T, F = void> = MutableSignal<T | F> & {
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  refetch: () => void;
};

export type Resource<T, F = void> = Signal<T | F> & {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  refetch: () => void;
  mutate: MutableSignal<T | F>['mutate'];
};

type CreateResourceOptions<T, F = void> = {
  equal?: ValueEqualityFn<T | F>;
  fallback?: F;
};

const { is } = Object;

export function resource<T, F = void>(source: () => Promise<T> | Observable<T>, opts?: CreateResourceOptions<T, F>): Resource<T, F> {
  const equal = (opts?.equal ?? is) as ValueEqualityFn<T | F>;
  const fallback = opts?.fallback as F;

  const trigger$ = new BehaviorSubject<void>(undefined);

  const state = mutable<T | F>(fallback, { equal }) as AssignableResource<T, F>;

  state.loading = signal(false);
  state.error = signal(null);

  const connection = source();
  const source$ = isObservable(connection) ? connection : from(connection);

  trigger$
    .pipe(
      tap(() => state.loading.set(true)),
      switchMap(() => source$),
      catchError(() => {
        state.error.set('Error fetching data');
        return of(fallback);
      }),
      tap(() => state.loading.set(false)),
    )
    .subscribe((value) => state.set(value));

  state.refetch = () => trigger$.next(undefined);

  return state;
}
```

I've added support for both fetch based sources & observables so that the implementer can either use HttpClient with all its bells & whistles, or just use a simple fetch call if they don't need it. While this does handle the basic concept it leaves a lot to be desired. We can improve upon various things like error handling, but any other improvements like caching, optimistic updates or pagination should be their own primitive that builds upon this one, as we did with stores & slices. There is however one thing I'd like the very core resource primitive to handle, and that's suspense.

The React team released Suspense back in version 16.6, I honestly haven't taken a look at it for a while, but I do remember some weirdness with it by throwing promises? That may have been a fever dream though, not sure... Anyway, I'll let the code do most of the talking, here's what a basic implementation of Suspense could look like in Angular:

```typescript
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, InjectionToken, NgModule, TemplateRef, computed, contentChild, inject } from '@angular/core';
import { mutable } from './mutable';
import { Resource } from './resource';

const SUSPENSE_TOKEN = new InjectionToken<SuspenseComponent>('APP_SUSPENSE');

export const provideSuspense = () => inject(SUSPENSE_TOKEN, { optional: true });

@Directive({
  selector: '[onSuspenseLoading]',
  standalone: true,
})
export class SuspenseLoadingDirective {}

@Directive({
  selector: '[onSuspenseError]',
  standalone: true,
})
export class SuspenseErrorDirective {}

@Component({
  selector: 'app-suspense',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  // We're providing the component itself, due to how Angular handles DI this will ensure that resources will grab the nearest parent Suspense boundry if it exists.
  providers: [{ provide: SUSPENSE_TOKEN, useExisting: SuspenseComponent }],
  // As the content is rendered initially i.e. when no resources have been registered all resources are instatiated and begin calling at the same time (unless some other @if/ngIf prevents it).
  template: `
    @if (!loading() && !error()) {
      <ng-content />
    } @else if (loading()) {
      <ng-container [ngTemplateOutlet]="loadingTemplate() || null" />
    } @else {
      <ng-container [ngTemplateOutlet]="errorTemplate() || null" />
    }
  `,
})
export class SuspenseComponent {
  protected readonly resources = mutable<Resource<any>[]>([]);
  protected readonly loading = computed(() => !this.resources().every((r) => !r.loading()));
  protected readonly error = computed(() => !this.resources().every((r) => !r.error()));

  protected readonly loadingTemplate = contentChild(SuspenseLoadingDirective, {
    read: TemplateRef,
  });
  protected readonly errorTemplate = contentChild(SuspenseErrorDirective, {
    read: TemplateRef,
  });

  // Both register and unregister can be handled within the resource creation function through DI.
  register(resource: Resource<any>) {
    const len = this.resources().length;
    this.resources.mutate((cur) => {
      cur.push(resource);
      return cur;
    });
    return len;
  }

  // cleanup for when the component containing the resource is destroyed
  deregister(index: number) {
    this.resources.mutate((cur) => {
      cur.splice(index, 1);
      return cur;
    });
  }
}

@NgModule({
  imports: [SuspenseComponent, SuspenseErrorDirective, SuspenseLoadingDirective],
  exports: [SuspenseComponent, SuspenseErrorDirective, SuspenseLoadingDirective],
})
export class SuspenseModule {}
```

This is a pretty basic implementation but I like that it gives us a new way to compose async data while preventing waterfalls. I've also added error handling to it because I couldn't come up with a reason to have a separate "ErrorBoundry" like React does. To finish up let's add the integration to the resource function as well as some other "nice-to-haves":

```typescript
import { DestroyRef, Signal, ValueEqualityFn, WritableSignal, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, catchError, first, isObservable, of, switchMap, takeUntil, tap } from 'rxjs';
import { MutableSignal } from '../mutable';
import { provideSuspense } from '../suspense';
import { createEquals, createErrorResolver, createFallback, createStorage } from './util';

type AssignableResource<T, F = void, S extends MutableSignal<T | F> = MutableSignal<T | F>> = S & {
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  refetch: () => void;
  destroy: () => void;
};

export type Resource<T, F = void, S extends MutableSignal<T | F> = MutableSignal<T | F>> = S & {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  refetch: () => void;
  destroy: () => void;
};

export type CreateResourceOptions<T, F = void, SIGNAL extends MutableSignal<T | F> = MutableSignal<T | F>, E = any> = {
  equal?: ValueEqualityFn<T | F>;
  fallback?: F | (() => F);
  storage?: (initial: T | F, opts?: { equal?: ValueEqualityFn<T | F> }) => SIGNAL;
  defer?: true;
  resolveError?: (error: E) => string;
  onError?: (error: E) => void;
};

export function resource<T, F = void, S extends MutableSignal<T | F> = MutableSignal<T | F>, E = any>(source: () => Promise<T> | Observable<T>, opts?: CreateResourceOptions<T, F, S, E>): Resource<T, F, S> {
  const destroyRef = inject(DestroyRef);
  const boundry = provideSuspense();
  const equal = createEquals(opts?.equal);
  const fallback = createFallback(opts?.fallback);
  const storage = createStorage(opts?.storage);
  const resolveError = createErrorResolver(opts?.resolveError);

  const destroy$ = new Subject<void>();

  const state = storage(fallback(), { equal }) as AssignableResource<T, F, S>;

  state.loading = signal(false);
  state.error = signal(null);

  let source$: Observable<T> | null = null;

  let sub = new Subscription();

  const fetchFromSource = () => {
    return of(null)
      .pipe(
        tap(() => state.loading.set(true)),
        switchMap(() => {
          if (source$) return source$;
          const connection = source();
          if (isObservable(connection)) {
            source$ = connection;
            return source$;
          } else {
            source$ = null;
          }
          return connection;
        }),
        catchError((err) => {
          state.error.set(resolveError(err));
          opts?.onError?.(err);
          return of(fallback());
        }),
        tap(() => state.loading.set(false)),
        first(),
        takeUntil(destroy$),
      )
      .subscribe((value) => state.set(value));
  };

  if (!opts?.defer) {
    sub = fetchFromSource();
  }

  state.refetch = () => {
    sub.unsubscribe();
    sub = fetchFromSource();
  };
  let index = -1;

  state.destroy = () => {
    boundry?.deregister(index);
    index = -1;
    destroy$.next();
    destroy$.complete();
  };

  index = boundry?.register(state) ?? -1;

  destroyRef.onDestroy(() => {
    boundry?.deregister(index);
  });

  return state;
}
```

As you can see we inject the boundry (optionally) & if one exists we bind/unbind with it when required. I've also added a few quality of life features like defering the first call to the source, a way to resolve errors & a way to provide your own storage signal or at least create it yourself. This allows for some basic storage functionality like saving the value in localStorage for example:

```typescript
type Todo = {
	id: string;
	name: string;
};

function fetchTodos(): Promise<Todo[]> {
	return fetch('https://jsonplaceholder.typicode.com/todos')
		.then((r) => r.json())
		.catch(() => []);
}

function storeTodos(todos: Todo[]) {
	localStorage.setItem('todos', JSON.stringify(todos));
}

function getStoredTodos(): Todo[] {
	const found = localStorage.getItem('todos');
	return found ? JSON.parse(found) : [];
}

@Component({
  ...
})
export class AppComponent {
	readonly state = resource(fetchTodos, {
		fallback: getStoredTodos,
		storage: (initial, opts) => {
			const sig = mutable(initial, opts);
			effect(() => storeTodos(sig()));
			return sig;
		},
	});
}

```

## Conclusion

This is an ongoing experiment in evolving common Angular patterns using a signal-based methodology. If these concepts resonate with you, I encourage you to try out these primitives and share your feedback. :) Look out for the future articles where we'll further explore how these primitives can be used to build more complex form & http building blocks. Until then, happy coding! 🚀
