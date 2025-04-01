import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounced } from '@mmstack/primitives';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: ` <input [(ngModel)]="state" />`,
  styles: ``,
})
export class AppComponent {
  state = debounced('123', { ms: 300 });

  e1 = effect(() => console.log(this.state()));

  e2 = effect(() => console.log(this.state.original(), 'orign'));
}
