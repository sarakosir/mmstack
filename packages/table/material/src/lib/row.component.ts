import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TableBodyComponent } from './table-body.component';
import { TableHeadComponent } from './table-head.component';

@Component({
  selector: 'mm-table-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableHeadComponent, TableBodyComponent],
  template: `
    <mm-table-head />
    <mm-table-body />
  `,
  styles: ``,
})
export class TableRowComponent {}
