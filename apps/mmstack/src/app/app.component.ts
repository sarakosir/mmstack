import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  isSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import {
  BooleanFieldComponent,
  BooleanState,
  derived,
  DerivedSignal,
  formGroup,
  FormGroupSignal,
  injectCreateBooleanState,
  injectCreateSearchState,
  injectCreateStringState,
  SearchFieldComponent,
  SearchState,
  StringFieldComponent,
  StringState,
} from '@mmstack/form-material';

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  child: Todo | null;
};

type TodoStateChildren = {
  title: StringState<Todo>;
  completed: BooleanState<Todo>;
  child: SearchState<Todo | null, Todo>;
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

  return <TParent = undefined>(
    value: Todo | DerivedSignal<TParent, Todo>,
  ): TodoState<TParent> => {
    const valueSig = isSignal(value) ? value : signal(value);

    return formGroup<Todo, TodoStateChildren, TParent>(valueSig, {
      title: stringFactory(derived(valueSig, 'title'), {
        label: () => 'Title',
      }),
      completed: booleanFactory(derived(valueSig, 'completed'), {
        label: () => 'Completed',
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
      }),
    });
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
    JsonPipe,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Todo</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mm-string-field [state]="state().children().title" />
        <mm-boolean-field [state]="state().children().completed" />
        <mm-search-field [state]="state().children().child" />
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

@Component({
  selector: 'app-root',
  imports: [TodoComponent],
  template: ` <app-todo [state]="state" /> `,
  styles: `
    :host {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `,
})
export class AppComponent {
  state = injectCreateTodoState()({
    id: 1,
    userId: 1,
    title: 'delectus aut autem',
    completed: false,
    child: null,
  });
}
