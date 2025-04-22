import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'demo',
    pathMatch: 'full'
  },
  {
    path: 'demo',
    loadChildren: () => import('./demo/demo.routes').then(m => m.DEMO_ROUTES)
  }
];
