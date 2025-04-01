import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { derived, stored } from '@mmstack/primitives';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: ` <input [(ngModel)]="t" />`,
  styles: ``,
})
export class AppComponent {
  state = stored(
    { user: 'test' },
    {
      key: 'yay',
      syncTabs: true,
    },
  );

  t = derived(this.state, 'user');

  e = effect(() => {
    console.log(this.state());
  });
}
