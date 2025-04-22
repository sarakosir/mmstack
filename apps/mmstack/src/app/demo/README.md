# Demo Section

This directory contains the demo components for the MMStack application. The demo section is designed to showcase the various features and components of the MMStack library.

## Structure

The demo section is organized as follows:

- `demo-home/`: Contains the home component for the demo section, which provides an overview of available demos.
- `table-demo/`: Contains the table demo component, which demonstrates the table component.
- `demo.routes.ts`: Contains the routes for the demo section.

## Adding a New Demo

To add a new demo component:

1. Create a new directory for your demo component (e.g., `form-demo/`).
2. Create your demo component in the new directory.
3. Add your demo component to the `demo.routes.ts` file.
4. Add a card for your demo component in the `demo-home.component.ts` file.

Example route addition in `demo.routes.ts`:

```typescript
import { MyNewDemoComponent } from './my-new-demo/my-new-demo.component';

export const DEMO_ROUTES: Route[] = [
  // ... existing routes
  {
    path: 'my-new-demo',
    component: MyNewDemoComponent
  }
];
```

Example card addition in `demo-home.component.ts`:

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>My New Demo</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <p>
      Description of my new demo.
    </p>
  </mat-card-content>
  <mat-card-actions>
    <a mat-raised-button color="primary" routerLink="/demo/my-new-demo">View Demo</a>
  </mat-card-actions>
</mat-card>
```

## Best Practices

- Each demo component should be standalone and self-contained.
- Include a back button to return to the demo home page.
- Document any special requirements or dependencies for your demo.
