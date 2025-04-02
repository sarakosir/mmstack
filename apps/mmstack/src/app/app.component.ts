import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { withHistory } from '@mmstack/primitives';

import { lens } from '@mmstack/primitives';

type User = {
  name?: {
    first?: string;
    last?: string;
  };
};

const user = signal<User>({});

const name = lens(user, 'name');

const firstName = lens(name, {
  from: (v) => v?.first,
  onChange: (next) =>
    name.update((prev) => (prev ? { ...prev, first: next } : { first: next })),
});

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
