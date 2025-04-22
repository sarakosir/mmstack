import { Route } from '@angular/router';
import { TableDemoComponent } from './table-demo/table-demo.component';
import { DemoHomeComponent } from './demo-home/demo-home.component';

export const DEMO_ROUTES: Route[] = [
  {
    path: '',
    component: DemoHomeComponent
  },
  {
    path: 'table',
    component: TableDemoComponent
  }
];
