import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { queryResource } from '@mmstack/resource';
import { clientRowModel } from '@mmstack/table-client';
import { ColumnDef, createTable, createTableState } from '@mmstack/table-core';
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
    footer: () => "yay"
  },
  {
    name: 'title',
    header: () => 'Title',
    accessor: (row) => row.title,
    footer: () => "zaz"

  },
];

@Component({
  selector: 'app-root',
  imports: [MatProgressBar, TableComponent, MatCardModule],
  template: `
    <mat-progress-bar
      mode="indeterminate"
      [style.visibility]="events.isLoading() ? 'visible' : 'hidden'"
    />
    <mat-card>
      <mm-table [state]="table" />
    </mat-card>
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

  readonly events = queryResource<EventDef[]>(
    () => ({
      url: 'http://localhost:3000/api/event-definition',
      params: {
        offset:
          this.tableState().pagination.page *
          this.tableState().pagination.pageSize,
        limit: this.tableState().pagination.pageSize,
      },
    }),
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
    data: clientRowModel(this.todos.value, this.todoState),
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
