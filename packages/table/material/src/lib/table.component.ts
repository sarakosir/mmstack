import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Table } from '@mmstack/table-core';
import { FooterRowComponent } from './footer-row.component';
import { HeaderRowComponent } from './header-row.component';
import { PaginatorComponent } from './paginator.component';
import { RowComponent } from './row.component';
import { ToolbarComponent } from './toolbar.component';

@Component({
  selector: 'mm-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderRowComponent,
    RowComponent,
    FooterRowComponent,
    PaginatorComponent,
    ToolbarComponent,
  ],
  template: `
    <header>
      <mm-toolbar  [globalFilterState]="state().features.globalFilter"/>
    </header>
    <div class="table-container">
      <div class="table">
        <div class="thead">
          @for (row of state().header.rows(); track row.id) {
            <mm-header-row [state]="row" />
          }
        </div>
        <div class="tbody">
          @for (row of state().body.rows(); track row.id) {
            <mm-row [state]="row" />
          }
        </div>
        <div class="tfoot">
          @for (row of state().footer.rows(); track row.id) {
            <mm-footer-row [state]="row" />
          }
        </div>
      </div>
    </div>
    <footer>
      <mm-paginator [state]="state().features.pagination" />
    </footer>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
      width: 100%;
      height: 100%;
      overflow: hidden;

      header {
        padding-top: var(--app-table-header-padding-top, 3px);
        padding-bottom: var(--app-table-header-padding-bottom, 8px);
        padding-left: var(--app-table-header-padding-left, 0);
        padding-right: var(--app-table-header-padding-right, 0);
      }

      div.table-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;

        div.table {
          display: flex;
          flex-direction: column;
          background: var(--mat-table-background-color, #fdfbff);
          table-layout: auto;
          white-space: normal;
          min-width: 100%;
          border: 0;
          border-spacing: 0;
          border-collapse: collapse;
          width: fit-content;

          div.thead {
            z-index: 500;
            padding-top: 10px;
            position: sticky;
            top: 0;

            display: flex;
            flex-direction: column;

            background: inherit;

            --mdc-outlined-text-field-label-text-font: var(
              --mat-table-header-headline-font,
              Roboto,
              sans-serif
            );
            --mdc-outlined-text-field-label-text-color: var(
              --mat-table-header-headline-color,
              rgba(0, 0, 0, 0.87)
            );
            --mdc-outlined-text-field-disabled-label-text-color: var(
              --mat-table-header-headline-color,
              rgba(0, 0, 0, 0.87)
            );
            --mdc-outlined-text-field-disabled-outline-color: transparent;
            --mdc-outlined-text-field-label-text-weight: var(
              --mat-table-header-headline-weight,
              500
            );
            --mdc-outlined-text-field-outline-width: 0;
            --mdc-outlined-text-field-focus-outline-width: 0;
          }

          div.tbody {
            display: contents;

            background: inherit;
            -moz-osx-font-smoothing: grayscale;
            -webkit-font-smoothing: antialiased;
            font-family: var(
              --mat-table-row-item-label-text-font,
              Roboto,
              sans-serif
            );
            font-size: var(--mat-table-row-item-label-text-size, 14px);
            line-height: var(
              --mat-table-row-item-label-text-line-height,
              1.25rem
            );
            font-size: var(--mat-table-row-item-label-text-size, 14px);
            font-weight: var(--mat-table-row-item-label-text-weight, 400);
          }
        }
      }
    }
  `,
})
export class TableComponent<T> {
  readonly state = input.required<Table<T>>();
}
