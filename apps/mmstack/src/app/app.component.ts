import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { injectCreateStringState, StringState } from '@mmstack/form-adapters';
import {
  BooleanFieldComponent,
  BooleanState,
  DateFieldComponent,
  DateState,
  derived,
  DerivedSignal,
  formArray,
  formGroup,
  FormGroupSignal,
  injectCreateBooleanState,
  injectCreateDateState,
  injectCreateSearchState,
  SearchFieldComponent,
  SearchState,
  StringFieldComponent,
} from '@mmstack/form-material';

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  createdOn?: Date;
  child: Todo | null;
};

type TodoStateChildren = {
  title: StringState<Todo>;
  completed: BooleanState<Todo>;
  child: SearchState<Todo | null, Todo>;
  createdOn: DateState<Todo>;
};

type TodoState<TParent = undefined> = FormGroupSignal<
  Todo,
  TodoStateChildren,
  TParent
>;

function injectCreateTodoState() {
  const stringFactory = injectCreateStringState();
  const booleanFactory = injectCreateBooleanState();
  const searchFactory = injectCreateSearchState();
  const dateFactory = injectCreateDateState();

  return <TParent = undefined>(
    value: Todo | DerivedSignal<TParent, Todo>,
    disable?: () => boolean,
  ): TodoState<TParent> => {
    const valueSig = isSignal(value) ? value : signal(value);

    console.log('construct group');
    return formGroup<Todo, TodoStateChildren, TParent>(valueSig, {
      title: stringFactory(derived(valueSig, 'title'), {
        label: () => 'Title',
        disable,
      }),
      completed: booleanFactory(derived(valueSig, 'completed'), {
        label: () => 'Completed',
        disable,
      }),
      child: searchFactory(derived(valueSig, 'child'), {
        label: () => 'Child',
        identify: () => (todo) => todo?.id.toString() ?? '',
        searchPlaceholder: () => 'Search',
        displayWith: () => (todo) => todo?.title ?? '',
        toRequest: () => (query) => {
          const params: Record<string, string | number> = {
            limit: 5,
          };

          if (query) {
            params['id'] = query;
          }

          return {
            url: 'https://jsonplaceholder.typicode.com/posts',
            params,
          };
        },
        disable,
      }),
      createdOn: dateFactory(
        derived(valueSig, {
          from: (v) => v.createdOn ?? null,
          onChange: (next) =>
            valueSig.update((cur) => ({
              ...cur,
              createdOn: next ?? undefined,
            })),
        }),
        {
          validation: () => ({
            required: true,
            min: new Date(),
          }),
          label: () => 'Created On',
          disable,
        },
      ),
    });
  };
}

export function injectCreateTodosState() {
  const factory = injectCreateTodoState();

  return (todos: Todo[], disable?: () => boolean) => {
    return formArray(todos, (value) => factory(value, disable));
  };
}

@Component({
  selector: 'app-todo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule,
    StringFieldComponent,
    BooleanFieldComponent,
    SearchFieldComponent,
    DateFieldComponent,
    JsonPipe,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Todo</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mm-string-field [state]="state().children().title" />
        <mm-date-field [state]="state().children().createdOn" />
      </mat-card-content>

      <mat-card-footer>
        {{ state().partialValue() | json }}
      </mat-card-footer>
    </mat-card>
  `,
  styles: `
    mat-card-content {
      padding-top: 8px;
    }
  `,
})
export class TodoComponent<TParent = undefined> {
  readonly state = input.required<TodoState<TParent>>();
}

function nestedTest(source: WritableSignal<number[]>) {
  const length = computed(() => source().length);

  const unstable = computed(() =>
    Array.from({ length: length() }).map((_, i) => computed(() => source()[i])),
  );

  effect(() => {
    unstable();
    console.log('unstable', unstable()); // triggers once (first time) & every time data changes, underlying signals also trigger
  });

  const stable = computed(() =>
    Array.from({ length: length() }).map((_, i) => ({
      value: computed(() => source()[i]),
    })),
  );

  effect(() => {
    stable();
    console.log('stable'); // triggers once (first time), but does not when data changes. underlying signals still trigger
  });

  return {
    trigger: () => {
      source.update((cur) => cur.map((v, i) => (i === 1 ? v + 1 : v))); // update the second element
    },
  };
}

@Component({
  selector: 'app-root',
  imports: [],
  template: ` <button (click)="state.trigger()">Toggle</button> `,
  styles: ``,
})
export class AppComponent {
  state = nestedTest(signal([1, 2, 3]));
}
