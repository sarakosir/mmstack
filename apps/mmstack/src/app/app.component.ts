import { Component, computed } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { queryResource } from '@mmstack/resource';
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

@Component({
  selector: 'app-root',
  imports: [MatProgressBar, TableComponent],
  template: `
    <mat-progress-bar
      mode="indeterminate"
      [style.visibility]="events.isLoading() ? 'visible' : 'hidden'"
    />

    <mm-table [state]="table" />
  `,
  styles: `
    nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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
