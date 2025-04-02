import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeaderRow } from '@mmstack/table-core';
import { HeaderCellComponent } from './header-cell.component';

@Component({
  selector: 'mm-header-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderCellComponent],
  template: `
    @for (cell of state().cells(); track cell.name) {
      <mm-header-cell [state]="cell" />
    }
  `,
  styles: `
    :host {
      display: flex;
      text-decoration: none;
      background: inherit;
      font-family: var(
        --mat-table-row-item-label-text-font,
        Roboto,
        sans-serif
      );
      line-height: var(--mat-table-row-item-label-text-line-height, 1.25rem);
      font-size: var(--mat-table-row-item-label-text-size, 14px);
      font-weight: var(--mat-table-row-item-label-text-weight, 400);
      height: var(--mat-table-row-item-container-height, 52px);
      min-height: var(--mat-table-row-item-container-height, 56px);
      color: var(--mat-table-row-item-label-text-color, rgba(0, 0, 0, 0.87));

      &.odd {
        --mat-table-background-color: var(
          --app-table-odd-row-background-color,
          var(--mat-autocomplete-background-color, #efedf1)
        );
        background-color: var(
          --app-table-odd-row-background-color,
          var(--mat-autocomplete-background-color, #efedf1)
        );
      }
    }
  `,
})
export class HeaderRowComponent {
  readonly state = input.required<HeaderRow>();
}
