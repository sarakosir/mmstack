import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { HeaderCell } from '@mmstack/table-core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'mm-header-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconButton, MatIcon],
  template: ` <div class="container">
    <span>{{ state().value() }}</span>
    <div class="actions">
      <button type="button" mat-icon-button (click)="state().features.sort.toggleSort()">
        <mat-icon>{{ sortIcon() }}</mat-icon>
      </button>

    </div>
  </div>`,
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
export class HeaderCellComponent {
  readonly state = input.required<HeaderCell>();


  protected readonly sortIcon = computed(() => {

   switch(this.state().features.sort.direction()) {
     case "asc":
       return "chevron_left";
     case "desc":
       return "chevron_right";
     default:
       return "check";
   }


  })
}
