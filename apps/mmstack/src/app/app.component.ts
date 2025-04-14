import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import {
  DateRangeFieldComponent,
  injectCreateDateRangeState,
  NumberFieldComponent,
  SearchFieldComponent,
  StringFieldComponent,
} from '@mmstack/form-material';
import { queryResource } from '@mmstack/resource';
import { clientRowModel } from '@mmstack/table-client';
import {
  ColumnDef,
  createTable,
  createTableState,
  TableState,
} from '@mmstack/table-core';
import { TableComponent } from '@mmstack/table-material';
type EventDef = {
  id: string;
  name: string;
};

const columns: ColumnDef<EventDef, string>[] = [
  {
    name: 'id',
    header: () => 'ID',
    accessor: (row) => row.id,
  },
  {
    name: 'name',
    header: () => 'Name',
    accessor: (row) => row.name,
  },
];

type Todo = {
  id: number;
  title: string;
};

const todoColumns: ColumnDef<Todo, string | number>[] = [
  {
    name: 'id',
    header: () => 'ID',
    accessor: (row) => row.id,
    footer: () => 'yay',
  },
  {
    name: 'title',
    header: () => 'Title',
    accessor: (row) => row.title,
    footer: () => 'zaz',
  },
];

function resolveSort({ sort }: TableState): string | null {
  if (!sort) return null;

  return sort.direction === 'desc' ? `-${sort.name}` : sort.name;
}

@Component({
  selector: 'app-root',
  imports: [
    MatProgressBar,
    TableComponent,
    MatCardModule,
    NumberFieldComponent,
    StringFieldComponent,
    SearchFieldComponent,
    DateRangeFieldComponent,
  ],
  template: `
    <!-- <mat-progress-bar
      mode="indeterminate"
      [style.visibility]="events.isLoading() ? 'visible' : 'hidden'"
    />
    <mat-card>
      <mm-table [state]="table" />
    </mat-card> -->
    <mm-date-range-field appearance="outline" [state]="dr" />
  `,
  styles: `
    mat-card {
      margin: 2rem;
      max-height: 80vh;
    }
  `,
})
export class AppComponent {
  readonly tableState = createTableState();

  readonly dr = injectCreateDateRangeState()(
    {
      start: new Date(),
      end: new Date(),
    },
    {
      label: () => 'yay',
      hint: () => 'A hint',
      start: {
        placeholder: () => 'Start',
      },
      validation: () => ({
        required: true,
        min: new Date('2025-01-01'),
        max: new Date('2025-12-31'),
      }),
    },
  );

  readonly events = queryResource<EventDef[]>(
    () => {
      const sortParam = resolveSort(this.tableState());

      const baseState = {
        offset:
          this.tableState().pagination.page *
          this.tableState().pagination.pageSize,
        limit: this.tableState().pagination.pageSize,
        search: this.tableState().globalFilter,
      };

      return {
        url: 'http://localhost:3000/api/event-definition',
        params: sortParam
          ? {
              ...baseState,
              sort: sortParam,
            }
          : baseState,
      };
    },
    {
      keepPrevious: true,
      defaultValue: [],
    },
  );

  readonly todos = httpResource<Todo[]>(
    'https://jsonplaceholder.typicode.com/todos',
    {
      defaultValue: [],
    },
  );
  readonly todoState = createTableState();

  readonly todoTable = createTable<Todo>({
    data: clientRowModel(this.todos.value, this.todoState, (row) => row.title),
    columns: todoColumns,
    state: this.todoState,
    opt: {
      pagination: {
        total: computed(() => this.todos.value().length),
      },
    },
  });

  readonly table = createTable<EventDef>({
    data: this.events.value,
    columns,
    state: this.tableState,
    opt: {
      pagination: {
        total: computed(() => {
          const t = this.events.headers()?.get('Content-Range')?.split('/')[1];
          if (t === undefined) return 0;

          return parseInt(t, 10);
        }),
      },
    },
  });
}
