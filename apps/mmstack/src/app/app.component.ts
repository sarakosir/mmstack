import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { withHistory } from '@mmstack/primitives';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="state" />

    <button (click)="state.undo()" [disabled]="!state.canUndo()">undo</button>
    <button (click)="state.redo()" [disabled]="!state.canRedo()">redo</button>

    <button (click)="state.clear()" [disabled]="!state.canClear()">
      clear
    </button>
  `,
  styles: ``,
})
export class AppComponent {
  state = withHistory(signal('yay'));
}
