import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type Cell } from '@mmstack/table-core';

@Component({
  selector: 'mm-footer-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ state().value() }}</span>`,
  styles: `
    :host {
      padding: 0 16px;
      background: inherit;
      border-bottom-color: var(
        --mat-table-row-item-outline-color,
        rgba(0, 0, 0, 0.12)
      );
      border-bottom-width: var(--mat-table-row-item-outline-width, 1px);
      border-bottom-style: solid;
      letter-spacing: var(--mat-table-row-item-label-text-tracking, 0.01625em);
      line-height: inherit;
      box-sizing: border-box;
      text-align: left;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex: 1;
      min-width: 200px;

      span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
    }
  `,
})
export class FooterCellComponent {
  readonly state = input.required<Cell<string>>();
}
