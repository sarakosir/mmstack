import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableState } from '@mmstack/table-core';

@Component({
  selector: 'mm-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="tbody">
      @for (row of state().rows(); track row.id) {
        <div class="tr">
          @for (col of row.columns(); track col.name) {
            <div class="cell">
              <span>{{ col().value() }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class TableComponent<T> {
  readonly state = input.required<TableState<T>>();
}
