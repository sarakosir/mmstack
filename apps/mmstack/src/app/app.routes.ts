import { Route } from '@angular/router';
import { HomeComponent } from './home.component';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  {
    path: 'other',
    loadComponent: () =>
      import('./other.component').then((m) => m.OtherComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
