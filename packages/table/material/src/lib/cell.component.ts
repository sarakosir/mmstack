import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CellState } from '@mmstack/table-core';

@Component({
  selector: 'mm-table-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<span>{{ state().value() }}</span>`,
  styles: ``,
})
export class TableCellComponent<T, U> {
  readonly state = input.required<CellState<T, U>>();
}
