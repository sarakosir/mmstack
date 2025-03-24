# Fun-grained reactivity in Angular: Part 2 – Forms

It's been a while since [Part 1 - Primitives](https://dev.to/mihamulec/fun-grained-reactivity-in-angular-part-1-primitives-41ia), where we played around with some basic signal building blocks like `mutable`, `store`, and `resource`. Life happens, Angular updates happen, and now we've got `model`... but some problems just stick around. And in the world of forms, that problem is, well, _forms_.

While angular 17 allowed us to bind signals to `ngModel`, which was _supposed_ to be the answer to all our two-way binding woes. And it _sort of_ works... until you start dealing with objects or arrays. Then things get a little weird.

See, `ngModel`, bound to a property of an object within a signal, has this habit of mutating your data _inline_. Like this:

```typescript
@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="user().name" />
    <p>Hello, {{ user().name }}!</p>
    <!-- updates -->
    <p>Hello, {{ userName() }}</p>
    <!-- doesn't update -->
    <button (click)="force()">Force change detection</button>
  `,
})
export class AppComponent {
  protected readonly user = signal({ name: 'Initial Name' });
  protected readonly userName = computed(() => this.user().name);

  protected force() {
    this.user.update((cur) => ({ ...cur }));
  }
}
```

You type in the input, and user().name changes. Great! Except... the user signal itself didn't technically update. The object inside it did. Which means any computed or effect watching user will not notice a thing. You've successfully mutated your data under the radar, and your carefully crafted reactive graph is now out of sync. Not ideal. Even more weird, the angular renderer _sometimes_ detects these changes "correctly" (when using zone.js change detection). When using zoneless, or by using a computed like "userName" above the changes arent detected until the user object is destructured, at which point data will "snap" to the value actually set within the input. Since we're moving to a zoneless & signal based future, this simply isn't good enough.

If you need a _quick fix_ to this problem, you can _force_ change detection on ngModelChange emission, by either directly updating the value or using a generic _trigger_ function:

```typescript
// Option 1: Destructure on update
<input [ngModel]="user().name" (ngModelChange)="updateName($event)" />

updateName(newName: string) {
  this.user.update(currentUser => ({ ...currentUser, name: newName }));
}
// Option 2: If you have multiple props, this might be easier
<input [(ngModel)]="user().name" (ngModelChange)="triggerChange()" />

triggerChange() {
   this.user.update((cur) => ({...cur}));
}
```

If all you're looking for here is a quick solution to this problem, there you go...but I think we can do better...much better ;). So, in this article we're going to ditch workarounds like this and build our own reactive form primitives, replacing ngModel _almost_ fully. Our goals with this re-work:

- Predictability: No undetectable mutations
- Render performance: Only update the parts of the dom that need to update
- Type safety: This isn't an issue with ngModel, but rather the ControlValueAccessor interface, which doesn't verify the types.
- Extensibility: Allow _relatively easy_ enchancements
- & most importantly...full reactivity: Changes to properties cause signal updates, so that dependent computeds/effects fire as expected

## Core primitives

Before we begin working on the form control signal & its derivatives, we need to quickly discuss a few _core concepts_ & create some primitives that our solution will use. The first thing I'd like you to take a look at is nested computeds, I think this was not allowed in angular 17, but I could be wrong there..it definitely works with ng18+.

Here's a bit of an upcoming part (tables) which uses this, it's a very simplified/contrived example, but it shows where we can use this. Specifically when working with paginated data we can render the rows (and calculate everything related to them) once..or rather only if the "length" of the page changes. The cells however need to be dynamic as data on another page will be different. Doing it like this causes minimal re-renders. Don't worry we'll show the full data table code when thats finished in an upcoming article, look forward to it! :)

```typescript
function equalsUser(a: User, b: User) {
  return a.id === b.id;
}

function accessName(u: User) {
  return u.name;
}

const data = signal([
  { id: 1, name: "John" },
  { id: 2, name: "Peter" },
]);

const length = computed(() => data().length); // stabilize so that rows are only re-rendered if the length of the paginated data changes

const rows = computed(() =>
  Array.from({ length: length() }).map((_, i) => {
    const value = computed(() => data()[i], { equal: equalsUser });
    return {
      value,
      cells: [createCell(value, accessName)], // many columns but in this contrived example only one
    };
  })
); // create row signals

function createCell(data: Signal<User>, accessor: (value: T) => string) {
  const;
  return computed(() => accessor(data())); // change cell when data changes
}
```

The key takeaway here is that the rows computed creates an array of objects, each containing a value signal (representing a row) and an array of cells. Each cell is its own computed. This means that if we update the name of a single user in the data signal, only the corresponding cell computed for that user's name will re-evaluate. The rows computed might re-evaluate (if the page size changes), but thanks to the nested structure, we avoid unnecessary calculations/re-renders.

If you'd like to go more in depth Ryan Carniato wrote a great series related to this topic: [Derivations in Reactivity](https://dev.to/this-is-learning/derivations-in-reactivity-4fo1)

### Two-Way Binding with Signals: The derived Primitive

Alright...knowing that, we need to create a system where data flows in both directions (two way binding), but, in a _stable_ way. Angular has only one requirement we need to satisfy here...to allow two-way binding it expects a WritableSignal, which it reads and calls .set on.

We could create a signal with internal signals, like so `signal({name: signal('John')})`, that will allow us to change the name, sure, but it completely breaks the reactive graph because now the name signal is not aware it depends on the user signal, making any framework/scheduler level optimizations impossible.

Ideally we'd simply derive the value from the user signal. Considering that, we could try the new linkedSignal primitive for this like so `const user = signal({name: 'John'}); const name = linkedSignal(() => user().name)`, this will ensure that changes to the user object _flow down_ to the name signal, but changes to the name signal don't "trigger" the user signal, so even though the value of "user" has changed when we change name, no computeds/effects depending on the user signal will "detect" that change. We could of course use an effect to change the user signal every time name changes, but that again completely breaks the reactive graph, as angular, or really any signal based framework, can't track signal dependencies when setting a value from an effect.

To solve these conundrums, we need to create our own primitives, something which reacts to changes in the parent signal, but also triggers the parent when it itself changes. In essence, what we really want is a computed, which has a set function that applies changes to the parents state. On that change the value part of the computed is re-calculated, which in turn updates the DOM. Here are two primitives that make this easier:

```typescript
import { computed, untracked, type CreateSignalOptions, type Signal, type WritableSignal } from '@angular/core';

// Makes a computed writable.
export function toWritable<T>(signal: Signal<T>, set: (value: T) => void, update?: (updater: (value: T) => T) => void): WritableSignal<T> {
  const internal = signal as WritableSignal<T>;
  internal.asReadonly = () => signal; // just returns the value, as it's already a computed
  internal.set = set; // "fakes" the setter function of a WritableSignal
  internal.update = update ?? ((updater) => set(updater(untracked(internal)))); // "fakes" the update function of a WritableSignal

  return internal;
}

type CreateDerivedOptions<T, U> = CreateSignalOptions<U> & {
  from: (v: T) => U;
  onChange: (newValue: U) => void;
};

export type DerivedSignal<T, U> = WritableSignal<U> & {
  from: (v: T) => U;
};

// Creates a signal for a parent-child relationship
export function derived<T, U>(source: WritableSignal<T>, { from, onChange, ...rest }: CreateDerivedOptions<T, U>): DerivedSignal<T, U> {
  const sig = toWritable<U>(
    computed(() => from(source()), rest),
    (newVal) => {
      onChange(newVal);
    },
  ) as DerivedSignal<T, U>;

  sig.from = from;

  return sig;
}

export function isDerivedSignal<T, U>(sig: WritableSignal<U>): sig is DerivedSignal<T, U> {
  return 'from' in sig;
}

export function toFakeDerived<T, U>(initial: WritableSignal<U>): DerivedSignal<T, U> {
  const sig = initial as DerivedSignal<T, U>;
  sig.from = () => untracked(initial);
  return sig;
}
```

These two primitives allow us to perfectly _describe_ the relationship between user and name, thus creating two WritableSignals, which remain in perfect sync like so:

```typescript
const user = signal({name: 'John', age: 30});
// only fires when name changes, but checks every time user changes. Triggers user on changes
const name = derived(user, {
    from: (u) => u.name,
    onChange: (next) => user.update((cur) => ({...cur, name: next}));
});
// only fires when age changes, but checks every time user changes. Triggers user on changes
const age = derived(user, {
    from: (u) => u.age,
    onChange: (next) => user.update((cur) => ({...cur, age: next}));
});
```

Since we're leaving "other" properties alone..even if those are sub-objects, the equality check of each derived signals internal computed wont re-fire if something else changes. If we want to stabilize it even more, we can provide our own equality function. The stability of those change propagations along with Angular's lazy computed evaluation & batch scheduling ensures a highly performant reactive system.

There is however one _big_ tradeoff here, the immutable data structures require us to destructure objects/arrays all over the state. In comparison to ngModel we lose on performance here as we're both doing a much more expensive property "set" & creating more work for the GC.

As most modern frameworks & patterns (such as most state management in React) rely on this these operations are already highly optimized in browsers. If we want to futher optimize this we could achieve that by simply using mutable signals described in [Part 1](https://dev.to/mihamulec/fun-grained-reactivity-in-angular-part-1-primitives-41ia), since they allow for both in-line mutation but also track changes as any other signal would. This way we can have the best of both worlds performance wise, but we might make the code a bit "trickier" to manage as we now need to consider _mutable_ objects in our codebase.

Alright, I think we're now ready for forms :)

## Form Control (finally!)

Lets start by looking at the type we're outlining here. I've added quite a few features here, keep/remove them as necessary within your codebase.

_Please note that while we're creating a lot of computeds here, the actual functions that calculate their values are never triggered until that computed (or its parent) is subscribed to at least once. So we can \_almost_ freely create as many as we want, unused things simply wont affect performance in any meaningful way.\_

```typescript
import { type Signal, type WritableSignal } from '@angular/core';
import { type DerivedSignal } from './primitives';
import { v7 } from 'uuid';

export const CONTROL_SYMBOL = Symbol.for('INTERNAL_CLIENT_FORM_CONTROL');

export type ControlType = 'control' | 'array' | 'group';

export type FormControlSignal<T, TParent = undefined, TControlType extends ControlType = 'control', TPartialValue = T | undefined> = {
  id: string; // unique identifier meant for tracking in @for/ngFor loops
  value: WritableSignal<T>; // the main value signal
  dirty: Signal<boolean>; // True when the value has been changed, false if reverted back
  touched: Signal<boolean>; // Triggered when the control has been interacted with, for example blur on an input
  error: Signal<string>; // Error message to be displayed
  disabled: Signal<boolean>; // True when the control is disabled
  readonly: Signal<boolean>; // True when the control is readonly
  required: Signal<boolean>; // True when the control is required, used to add * to the label
  label: Signal<string>; // Label to be displayed
  hint: Signal<string>; // Hint to be displayed
  markAsTouched: () => void; // Marks the control as touched
  markAllAsTouched: () => void; // Marks the control and child controls as touched
  markAsPristine: () => void; // Sets touched to false
  markAllAsPristine: () => void; // Sets touched to false on self and all child controls
  reconcile: (newValue: T) => void; // Resets the control to a new value & new initial value, meant for new data comming from the server, only sets if the value is not dirty. This retains changes the user has made to the form
  forceReconcile: (newValue: T) => void; // Same as reconcile, but also resets if the value is dirty
  reset: () => void; // Resets the field to the initial value
  resetWithInitial: (initial: T) => void; // Resets the field to the initial value & sets initial
  from?: DerivedSignal<TParent, T>['from']; // Used in form groups & arrays to reconcile the data
  equal: (a: T, b: T) => boolean; // Provided equality function, defaults to Object.is
  [CONTROL_SYMBOL]: true; // Symbol for internal type checking
  controlType: TControlType; // Control type for type checking & reconciliation
  partialValue: Signal<TPartialValue>; // Value that is used when "patching" the state on the server, is a deep partial of the value
};
```

As you can see we've created quite the interface there, I'll leave some things for later such as the "from" property, as that'll be obvious once we get to form groups, but there are a few things id like to ellaborate on:

1. We're using a primitive id for @for tracking, due to some very weird behavior when using signals in the tracking function, I won't get into it now but @for(...;track obj.value()) simply won't work as expected.
2. These control signals are _relatively expensive_ to create, but they should only really be constructed "once" in the case of a singular form. In our user signal example, we'd construct only one signal for each property & keep it for the lifetime of the form, what gets changed are sub-signals such as value, dirty, error etc. In fact if you really want to go far with it, you could simply construct it once when needed, store that state graph in a global store & then reconcile it every time you need to re-use it (for example any time a user opens a screen). This way the performance cost of constructing a forms reactive graph becomes truly neglibile.
3. I'd also like to re-iterate that while we're creating quite a few computeds angular will not fire the functions within them until they are subscribed to. I explain this in depth in [Part 1 - Primitives](https://dev.to/mihamulec/fun-grained-reactivity-in-angular-part-1-primitives-41ia), so we don't have to worry about how expensive functions are unless we call them. There is an insignificant _expense_ paid to create new computeds, but as said in point 2, this can be made to happen only once/only when needed.
4. Reconciliation is something we require in our system, since we have data that can change during the lifetime of a form through an SSE subscription triggering when another user changes the same entity & to re-use structures in an object pool. I've included it, because it's a cool feature, but feel free to remove it.
5. Similarly to reconciliation, partial patches are something we use to optimize the data going upstream over the network, if your server/s don't support it, you can remove it, or simply not call it anywhere (see point 3).
6. Errors are always strings, validators either return an error message such as "Name is required" or an empty string "", an empty string is considered a valid state. The system assumes synchronous validation, but can easily be extended to support async validators if you require them, just make the validator return a string while pending and then either an empty string/message depending on if its valid.

```typescript
export type CreateFormControlOptions<T, TControlType extends ControlType = ControlType> = CreateSignalOptions<T> & {
  validator?: () => (value: T) => string;
  onTouched?: () => void;
  disable?: () => boolean;
  readonly?: () => boolean;
  required?: () => boolean;
  label?: () => string;
  id?: () => string;
  hint?: () => string;
  dirtyEquality?: ValueEqualityFn<T>;
  onReset?: () => void;
  controlType?: TControlType;
  overrideValidation?: () => string;
};

export function formControl<T, TParent = undefined, TControlType extends ControlType = 'control', TPartialValue = T | undefined>(initial: DerivedSignal<TParent, T> | T, opt?: CreateFormControlOptions<T, TControlType>): FormControlSignal<T, TParent, TControlType, TPartialValue> {
  const value = isSignal(initial) ? initial : signal(initial, opt);
  const initialValue = signal(untracked(value));
  const eq = opt?.equal ?? Object.is;

  const dirtyEq = opt?.dirtyEquality ?? eq;

  const disabled = computed(() => opt?.disable?.() ?? false);
  const readonly = computed(() => opt?.readonly?.() ?? false);

  const dirty = computed(() => !dirtyEq(value(), initialValue()));

  const touched = signal(false);

  const validator = computed(() => opt?.validator?.() ?? (() => ''));

  const error = computed(() => {
    if (opt?.overrideValidation) return opt.overrideValidation();
    if (disabled() || readonly()) return '';
    return validator()(value());
  });

  const markAsTouched = () => {
    touched.set(true);
    opt?.onTouched?.();
  };
  const markAllAsTouched = markAsTouched;

  const markAsPristine = () => touched.set(false);
  const markAllAsPristine = markAsPristine;

  const label = computed(() => opt?.label?.() ?? '');

  const patchValue = computed(() => (dirty() ? value() : undefined));

  const internalReconcile = (newValue: T, force = false) => {
    const isDirty = untracked(dirty);

    if (!isDirty || force) {
      // very dangerous use of untracked here, don't do this everywhere :)
      // thanks to  u/synalx for the idea to use untracked here
      untracked(() => {
        initialValue.set(newValue);
        value.set(newValue);
      });
    }
  };

  return {
    id: opt?.id?.() ?? v7(),
    value,
    dirty,
    touched,
    error,
    label,
    required: computed(() => opt?.required?.() ?? false),
    disabled,
    readonly,
    hint: computed(() => opt?.hint?.() ?? ''),
    markAsTouched,
    markAllAsTouched,
    markAsPristine,
    markAllAsPristine,
    from: (isSignal(initial) ? initial.from : undefined) as FormControlSignal<T, TParent, TControlType>['from'],
    reconcile: (newValue: T) => internalReconcile(newValue),
    forceReconcile: (newValue: T) => internalReconcile(newValue, true),
    reset: () => {
      opt?.onReset?.();
      value.set(untracked(initialValue));
    },
    resetWithInitial: (initial: T) => {
      opt?.onReset?.();
      initialValue.set(initial);
      value.set(initial);
    },
    equal: eq,
    [CONTROL_SYMBOL]: true,
    controlType: (opt?.controlType ?? 'control') as TControlType,
    partialValue: patchValue as Signal<TPartialValue>,
  };
}
```

Ok we now have the implementation of the core formControl signal...as you can see it's basically what we specified in the type, with some typecasting required to make TS happy, this isn't a problem as it's only internal, the function signature guarentees type safety even with the casts. The provided value is either a derivation or a direct value if the formControl is being used standalone.

We've also made pretty much every property the user can provide a function, this allows us to say pass a signal (like another formControl.value) to the disable option & have the formControl react to that signal.

_One thing of note is the use of `untracked` in the reconcile function, this is a very dangerous one so don't use it this way unless you know exactly when/why ;). Since untracked also opts out of any reactive context, this allows us to set signals from within a computed/linkedSignal computation. Using this could potentially cause infinite loops or unexpected change detection behavior, but the current implementation is safe in this specific case. But there is a good reason the Angular team decided to otherwise throw errors when doing that. :) Thanks to [u/synalx](https://www.reddit.com/user/synalx) for pointing this use of untracked out!_

## Form Group

Next up let's work on the form group, this is meant to be used to provide a control layer where we have a parent and controls that bind to child properties of that parent (just like a FormGroup), as such it requires derived signals to work.

As you can see bellow the form group is pretty much just a formControl, but also adds the children signal property so that we can access child controls & bind them to various inputs. Various properties such as .error, .touched, .markAllAsTouched read/write to itself and its children.

This is quite similar to Angulars internal FormGroup's purpose, but due to the ability to provide a reactive child function it also functions as a typesafe FormRecord replacement. Lets take a look, since I think the code will be more-or-less self-explanatory.

```typescript
import { computed, isSignal, signal, untracked, type Signal, type WritableSignal } from '@angular/core';
import { formControl, type CreateFormControlOptions, type FormControlSignal } from './form-control';
import { isDerivedSignal, toFakeDerived, type DerivedSignal } from './primitives';

type SignalValue<T> = T extends Signal<infer U> ? U : never;

type DerivationPartialValues<TDerivations extends Record<string, FormControlSignal<any, any, any, any>>> = {
  [K in keyof TDerivations]: Exclude<SignalValue<TDerivations[K]['partialValue']>, undefined>;
};

export type FormGroupSignal<T, TDerivations extends Record<string, FormControlSignal<any, T, any, any>>, TParent = undefined> = FormControlSignal<T, TParent, 'group', Partial<DerivationPartialValues<TDerivations>>> & {
  children: Signal<TDerivations>; // typesafe signal of child controls
  ownError: Signal<string>; // the error signal holds an INVALID state if the group or its children are invalid, this only returns the validation results of the group, so that they can be displayed
};

type UnknownObject = Record<PropertyKey, unknown>;

function entries<T extends UnknownObject>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

function values<T extends UnknownObject>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

export type CreateFormGroupOptions<T, TDerivations extends Record<string, FormControlSignal<any, T, any, any>>> = CreateFormControlOptions<T, 'group'> & {
  createBasePartialValue?: (value: T) => Partial<DerivationPartialValues<TDerivations>>;
};

export function formGroup<T, TDerivations extends Record<string, FormControlSignal<any, T, any, any>>, TParent = undefined>(initial: DerivedSignal<TParent, T> | T | WritableSignal<T>, providedChildren: (() => TDerivations) | TDerivations, opt?: CreateFormGroupOptions<T, TDerivations>): FormGroupSignal<T, TDerivations, TParent> {
  const valueSignal = isSignal(initial) ? initial : signal(initial);
  // we fake a derivation if not present, so that .from is present on the signal
  const value = isDerivation<TParent, T>(valueSignal) ? valueSignal : toFakeSignalDerivation<TParent, T>(valueSignal);

  // we allow for a function/signal to be passed, this case should only be used if the child controls change dependent upon something, say if a formControl is flipped into a formGroup.
  const children = typeof providedChildren === 'function' ? computed(() => providedChildren()) : computed(() => providedChildren);

  // array allows for easier handling
  const derivationsArray = computed(() => values(children()));

  const childrenDirty = computed(() => !!derivationsArray().length && derivationsArray().some((d) => d.dirty()));

  // by default dont compare object references, just use childrenDirtySignal
  const baseDirtyEq = opt?.dirtyEquality ?? opt?.equal ?? (() => true);

  // function which calls a signal becomes a signal
  const dirtyEquality = (a: T, b: T) => {
    return baseDirtyEq(a, b) && !childrenDirty();
  };

  // group control
  const ctrl = formControl<T, TParent, 'group'>(value, {
    ...opt,
    dirtyEquality,
    controlType: 'group',
    readonly: () => {
      // readonly if is readonly or all children are readonly
      if (opt?.readonly?.()) return true;
      return !!derivationsArray().length && derivationsArray().every((d) => d.readonly());
    },
    disable: () => {
      if (opt?.disable?.()) return true;
      return !!derivationsArray().length && derivationsArray().some((d) => d.disabled());
    },
  }) satisfies FormControlSignal<T, TParent, 'group'>;

  const childrenTouched = computed(() => !!derivationsArray().length && derivationsArray().some((d) => d.touched()));

  const touched = computed(() => ctrl.touched() || childrenTouched());

  const dirty = computed(() => ctrl.dirty() || childrenDirty());

  const childError = computed(() => {
    if (!derivationsArray().length) return '';
    return derivationsArray()
      .map((d) => d.error())
      .join('\n');
  });

  const error = computed(() => {
    const ownError = ctrl.error();
    if (ownError) return ownError;
    return childError() ? 'INVALID' : '';
  });

  const markAllAsTouched = () => {
    ctrl.markAllAsTouched();
    for (const ctrl of untracked(derivationsArray)) {
      ctrl.markAllAsTouched();
    }
  };

  const markAllAsPristine = () => {
    ctrl.markAllAsPristine();
    for (const ctrl of untracked(derivationsArray)) {
      ctrl.markAllAsPristine();
    }
  };

  const reconcile = (newValue: T) => {
    // set the children values based on the derivation of the new value
    for (const ctrl of untracked(derivationsArray)) {
      const from = ctrl.from;
      if (!from) continue;
      ctrl.reconcile(from(newValue));
    }
    ctrl.reconcile(newValue);
  };

  const forceReconcile = (newValue: T) => {
    for (const ctrl of untracked(derivationsArray)) {
      const from = ctrl.from;
      if (!from) continue;
      ctrl.forceReconcile(from(newValue));
    }
    ctrl.forceReconcile(newValue);
  };

  const createBaseValueFn = opt?.createBasePartialValue;

  const basePartialValue: Signal<Partial<DerivationPartialValues<TDerivations>>> = createBaseValueFn ? computed(() => createBaseValueFn(ctrl.value())) : computed(() => ({}));

  const partialValue = computed(() => {
    const obj: Partial<DerivationPartialValues<TDerivations>> = basePartialValue();
    if (!dirty()) return obj;

    for (const [key, ctrl] of entries(children())) {
      const pv = ctrl.partialValue();
      if (pv === undefined) continue;
      obj[key] = pv;
    }

    return obj;
  });

  return {
    ...ctrl,
    children,
    partialValue,
    reconcile,
    forceReconcile,
    ownError: ctrl.error,
    touched,
    dirty,
    error,
    markAllAsPristine,
    markAllAsTouched,
    reset: () => {
      for (const ctrl of untracked(derivationsArray)) {
        ctrl.reset();
      }
      ctrl.reset();
    },
    resetWithInitial: (initial: T) => {
      for (const ctrl of untracked(derivationsArray)) {
        const from = ctrl.from;
        from ? ctrl.resetWithInitial(from(initial)) : ctrl.reset();
      }
      ctrl.resetWithInitial(initial);
    },
  };
}
```

## Form Array

While the basic formControl & formGroup should handle _most_ usecases there is an edge case covered by angulars FormArray, this is where we need an array of controls instead of just an array of values, which we add/remove controls from.

_If your're working with just an array of something, where the values don't require child controls, you should just use a basic formControl of type T[]._

We've also added `built-in reconciliation` of child formControls. This allows us to react to value changes, but save on compute by skiping the creation for existing control. This is not necessary so you can replace it with a simple computed if you want to remove reconciliation, but I do think it's pretty cool. ;)

I also included some of our array validators, to make adding specific validation easy & integration with UI elements easier.

```typescript
import { computed, linkedSignal, untracked, type Signal, type WritableSignal } from '@angular/core';
import { formControl, type CreateFormControlOptions, type FormControlSignal } from './form-control';
import { type SignalValue } from './form-group';
import { derived, type DerivedSignal } from './primitives';

function minArrayLengthMsg(min: number, elementLabel: string) {
  return `Min ${min} ${elementLabel}`;
}

function maxArrayLengthMsg(max: number, elementLabel: string) {
  return `Max ${max} ${elementLabel}`;
}

function minArrayLengthValidator(min: number, elementLabel: string) {
  const msg = minArrayLengthMsg(min, elementLabel);
  return (val: any[]) => (val.length >= min ? '' : msg);
}

function maxArrayLengthValidator(max: number, elementLabel: string) {
  const msg = maxArrayLengthMsg(max, elementLabel);
  return (val: any[]) => (val.length <= max ? '' : msg);
}

export type ArrayValidatorOpt = {
  min?: number;
  max?: number;
  elementLabel?: string;
};

export function arrayValidator<T extends any[]>(opt: ArrayValidatorOpt = {}) {
  const min = opt.min ?? 0;
  const max = opt.max ?? Number.MAX_SAFE_INTEGER;
  const elementLabel = opt.elementLabel ?? 'items';

  const minVal = minArrayLengthValidator(min, elementLabel);
  const maxVal = maxArrayLengthValidator(max, elementLabel);

  return (val: T) => minVal(val) || maxVal(val);
}

export type FormArraySignal<T, TIndividualState extends FormControlSignal<T, any, any, any> = FormControlSignal<T, any, any, any>, TParent = undefined> = FormControlSignal<T[], TParent, 'array', Exclude<SignalValue<TIndividualState['partialValue']>, null | undefined>[] | undefined> & {
  ownError: Signal<string>;
  children: Signal<TIndividualState[]>;
  push: (value: T) => void; // add new control with value
  remove: (index: number) => void; // remove at index
  min: Signal<number>; // for display purposes
  max: Signal<number>; // for display purposes
  canAdd: Signal<boolean>; // disable add button if false
  canRemove: Signal<boolean>; // disable remove buttons if false
};

export type CreateFormArraySignalOptions<T, TIndividualState extends FormControlSignal<T, any, any, any>> = CreateFormControlOptions<T> & {
  min?: () => number;
  max?: () => number;
  elementLabel?: () => string;
  toPartialValue?: (v: T) => Exclude<SignalValue<TIndividualState['partialValue']>, null | undefined>;
};

function createReconcileChildren<T, TIndividualState extends FormControlSignal<T, any, any, any>>(factory: (val: DerivedSignal<T[], T>, idx: number, opt?: CreateFormControlOptions<T>) => TIndividualState, opt?: CreateFormControlOptions<T>) {
  return (length: number, source: WritableSignal<T[]>, prev?: TIndividualState[]): TIndividualState[] => {
    if (!prev) {
      const nextControls = [];

      for (let i = 0; i < length; i++) {
        nextControls.push(
          factory(
            derived(source, {
              from: (v) => v[i],
              onChange: (next) => source.update((cur) => cur.map((v, idx) => (idx === i ? next : v))),
            }),
            i,
            opt,
          ),
        );
      }

      return nextControls;
    }

    const next = [...prev];

    if (length < prev.length) {
      next.splice(length);
    } else if (length > prev.length) {
      for (let i = prev.length; i < length; i++) {
        next.push(
          factory(
            derived(source, {
              from: (v) => v[i],
              onChange: (next) => source.update((cur) => cur.map((v, idx) => (idx === i ? next : v))),
            }),
            i,
            opt,
          ),
        );
      }
    }

    return next;
  };
}

export function formArray<T, TIndividualState extends FormControlSignal<T, any, any, any> = FormControlSignal<T, any, any, any>, TParent = undefined>(initial: T[] | DerivedSignal<TParent, T[]>, factory: (val: DerivedSignal<T[], T>, idx: number, opt?: CreateFormControlOptions<T>) => TIndividualState, opt?: CreateFormArraySignalOptions<T, TIndividualState>): FormArraySignal<T, TIndividualState, TParent> {
  const eq = opt?.equal ?? Object.is;

  const arrayEqual = (a: T[], b: T[]) => {
    if (a.length !== b.length) return false;
    if (!a.length) return true;

    return a.every((v, i) => eq(v, b[i]));
  };

  const min = computed(() => opt?.min?.() ?? 0);
  const max = computed(() => opt?.max?.() ?? Number.MAX_SAFE_INTEGER);
  const elementLabel = computed(() => opt?.elementLabel?.() ?? 'items');

  const validator = () =>
    arrayValidator<T[]>({
      min: min(),
      max: max(),
      elementLabel: elementLabel(),
    });

  const arrayOptions: CreateFormControlOptions<T[], 'array'> = {
    ...opt,
    equal: arrayEqual,
    validator,
    dirtyEquality: (a, b) => a.length === b.length,
    controlType: 'array',
  };

  const ctrl = formControl<T[], TParent, 'array'>(initial, arrayOptions) satisfies FormControlSignal<T[], TParent, 'array'>;

  const length = computed(() => ctrl.value().length);

  const reconcileChildren = createReconcileChildren<T, TIndividualState>(factory, opt);

  // linkedSignal used to re-use previous value so that only length changes are affected and existing controls are kept, but updated
  const children = linkedSignal<number, TIndividualState[]>({
    source: () => length(),
    computation: (len, prev) => reconcileChildren(len, ctrl.value, prev?.value),
  });

  const ownError = computed(() => validator()(ctrl.value()));

  const error = computed((): string => {
    if (ownError()) return ownError();
    if (!children().length) return '';
    return children().some((c) => c.error()) ? 'INVALID' : '';
  });

  const dirty = computed(() => {
    if (ctrl.dirty()) return true;
    if (!children().length) return false;
    return children().some((c) => c.dirty());
  });

  const markAllAsTouched = () => {
    ctrl.markAllAsTouched();
    for (const c of untracked(children)) {
      c.markAllAsTouched();
    }
  };
  const markAllAsPristine = () => {
    ctrl.markAllAsPristine();
    for (const c of untracked(children)) {
      c.markAllAsPristine();
    }
  };

  const toPartialValue = opt?.toPartialValue ?? ((v: T) => v);
  const partialValue = computed(() => {
    if (!dirty()) return undefined;
    return children().map((c) => {
      const pv = c.partialValue();
      if (pv) return pv;
      if (c.controlType === 'control') return undefined;

      // return full value for  child objects/arrays as this cannot be partially patched without idx
      return toPartialValue(c.value());
    });
  });

  const touched = computed(() => ctrl.touched() || !!(children().length && children().some((c) => c.touched())));

  const reconcile = (newValue: T[]) => {
    const ctrls = untracked(children);

    for (let i = 0; i < newValue.length; i++) {
      ctrls.at(i)?.reconcile(newValue[i]); // reconcile existing controls that are relevant addition/removal will be handled after ctrl.reconcile through linkedSignal
    }

    ctrl.reconcile(newValue);
  };

  const forceReconcile = (newValue: T[]) => {
    const ctrls = untracked(children);

    for (let i = 0; i < newValue.length; i++) {
      ctrls.at(i)?.forceReconcile(newValue[i]);
    }

    ctrl.forceReconcile(newValue);
  };

  return {
    ...ctrl,
    ownError,
    error,
    touched,
    children,
    dirty,
    markAllAsTouched,
    markAllAsPristine,
    min,
    max,
    partialValue,
    canAdd: computed(() => !ctrl.disabled() && !ctrl.readonly() && length() < max()),
    canRemove: computed(() => !ctrl.disabled() && !ctrl.readonly() && length() > min()),
    reconcile,
    forceReconcile,
    reset: () => {
      for (const c of untracked(children)) {
        c.reset();
      }
      ctrl.reset();
    },
    resetWithInitial: (initial: T[]) => {
      const ctrls = untracked(children);
      for (let i = 0; i < initial.length; i++) {
        ctrls.at(i)?.resetWithInitial(initial[i]);
      }
      ctrl.resetWithInitial(initial);
    },
    push: (next) => ctrl.value.update((cur) => [...cur, next]),
    remove: (idx) => ctrl.value.update((cur) => cur.filter((_, i) => i !== idx)),
  };
}
```

## Angular material & NgModel

With the form primitives we've created, you can now create any form and bind directly to say an inputs value property.

If you however want/need to use ngModel under the hood, as you would due to say Angular Material's form-field being tightly coupled to NgModel, you'll need to propagate the touched state separately as well as creating a validation directive. This can easily be done with an effect within the control component for example:

```typescript
import { computed, Directive, effect, input } from '@angular/core';
import { NG_VALIDATORS, type Validator } from '@angular/forms';

@Directive({
  selector: '[ngModel][appProvidedError]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: ProvidedErrorValidator,
      multi: true,
    },
  ],
})
export class ProvidedErrorValidator implements Validator {
  readonly appProvidedError = input('');
  private onChange = () => {
    // noop
  };

  private readonly valid = computed(() => {
    return !this.appProvidedError();
  });

  constructor() {
    effect(() => {
      this.valid();
      this.onChange();
    });
  }

  validate() {
    return !this.valid() ? { providedError: this.appProvidedError() } : null;
  }

  registerOnValidatorChange(fn: () => void) {
    this.onChange = fn;
  }
}

@Component({
  selector: 'app-text-input',
  imports: [FormsModule, ProvidedErrorValidator],
  template: `
<!-- value example -->
<input [(value)]="state().value" [disabled]="state().disabled()" [readonly]="state().readonly()" [required]="state().required()" [class.error]="state().touched() && state().error()" (blur)="state().markAsTouched()" />

<!-- ngModel example -->
<input [(ngModel)]="state().value" [disabled]="state().disabled()" [readonly]="state().readonly()" [required]="state().required()" [appProvidedError]="state().error()" (blur)="state().markAsTouched()" />


@if (state().touched() && state().error() {
 <span class="error">{{state().error()}}</span>
}
`,
})
export class TextInputComponent<TParent = undefined> {
  readonly state = input.required<FormControl<string | null, TParent>>();

  private readonly model = viewChild.required(NgModel);
  constructor() {
    /* We could destroy this effect in some other cases where state the   
    "state control" never changes, in this case, since it's an input we 
    keep it so that the component is more re-usable */
    effect(() => {
      if (!this.state().touched()) return;
      this.model().control.markAsTouched();
    });
  }
}
```

In our case we abstract it a bit more so that it's easier to construct forms with reactive state, here's our string field component:

```typescript
export type StringValidatorOpt = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  not?: string[];
  blanks?: boolean;
  exact?: string | null;
  oneOf?: string[];
};

export type StringStateOpt = Omit<CreateFormControlOptions<string | null, 'control'>, 'validator' | 'required'> & {
  validation?: () => StringValidatorOpt;
  autocomplete?: () => AutoFill;
  placeholder?: () => string;
};

export function createStringState<TParent = undefined>(value: string | null | DerivedSignal<TParent, string | null>, opt?: StringStateOpt): StringState<TParent> {
  const validation = computed(() => opt?.validation?.() ?? {});

  // for the sake of brevity I've only provided the StringValidatorOpt interface, not the validators themselves
  const validator = () => stringValidator(validation());

  const state = formControl<string | null, TParent, 'control'>(value, {
    ...opt,
    validator,
    required: () => validation().required ?? false,
  }) as FormControlSignal<string | null, TParent, 'control'>;

  return {
    ...state,
    autocomplete: computed(() => opt?.autocomplete?.() ?? 'off'),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    type: 'string',
  };
}

@Component({
  selector: 'app-string-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ProvidedErrorValidator, MatIcon],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-string-field]': 'true',
  },
  template: `
    <mat-form-field [appearance]="appearance()" [floatLabel]="floatLabel()" [subscriptSizing]="subscriptSizing()" [hideRequiredMarker]="hideRequiredMarker()">
      <mat-label>{{ state().label() }}</mat-label>

      @if (iconPrefix()) {
        <mat-icon matPrefix>{{ iconPrefix() }}</mat-icon>
      }

      <input matInput [(ngModel)]="state().value" [autocomplete]="state().autocomplete()" [disabled]="state().disabled()" [readonly]="state().readonly()" [required]="state().required()" (blur)="state().markAsTouched()" [placeholder]="state().placeholder()" [appProvidedError]="state().error()" />

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }

      <ng-content />
    </mat-form-field>
  `,
  styles: `
    .app-string-field {
      display: contents;
    }
  `,
})
export class StringFieldComponent<TParent = undefined> {
  readonly appearance = input<MatFormFieldAppearance>(inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.appearance ?? 'outline');
  readonly floatLabel = input<FloatLabelType>(inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.floatLabel ?? 'auto');
  readonly subscriptSizing = input<SubscriptSizing>(inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.subscriptSizing ?? 'fixed');
  readonly hideRequiredMarker = input<boolean>(inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.hideRequiredMarker ?? false);

  readonly iconPrefix = input<string>();

  readonly state = input.required<StringState<TParent>>();

  private readonly model = viewChild.required(NgModel);

  constructor() {
    effect(() => {
      if (!this.state().touched()) return;
      this.model().control.markAsTouched();
    });
  }
}
```

## Conclusion

So we now have a great way of modeling reactive state & integrating it with forms.

We've been using these primitives & abstractions internally for a few months now and after a bit of explanation to the team on what the purposes of derivations are, they've really started to love this approach in form state management.

If you decide to give it a shot & have some input, or if you have any questions feel free to reach out :).

Before I go I'd like to share an [example](https://github.com/mihajm/event7/blob/master/libs/event-definition/client/src/lib/event-definition-form.component.ts) of using these primitives fully, just so you can visualize how it integrates. Please note that the github project linked uses a "beta" version of these primitives, so there are some minor differences. The ones in the article are more refined :).

Other than that I'll see you in the next article (hopefully less than a year from now), happy coding! 🚀
