import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { withHistory } from '@mmstack/primitives';
import { Link } from '@mmstack/router-core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Link],
  template: `
    <router-outlet />
    <br />
    <nav>
      <a mmLink="/">Home</a>
      <a mmLink="/other">Other</a>
    </nav>
  `,
  styles: `
    nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `,
})
export class AppComponent {
  state = withHistory(signal('yay'));
}
