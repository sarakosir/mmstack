# @mmstack/form-core

[![npm version](https://badge.fury.io/js/%40mmstack%2Fform-core.svg)](https://www.npmjs.com/package/@mmstack/form-core)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mihajm/mmstack/blob/master/packages/form/core/LICENSE)

`@mmstack/form-core` is an Angular library that provides a powerful, signal-based approach to building reactive forms. It offers a flexible and type-safe alternative to `ngModel` and Angular's built-in reactive forms, while leveraging the efficiency of Angular signals. This library is designed for fine-grained reactivity and predictable state management, making it ideal for complex forms and applications.

## Features

- **Signal-Based:** Fully utilizes Angular signals for efficient change detection and reactivity.
- **Type-Safe:** Strongly typed API with excellent TypeScript support, ensuring compile-time safety and reducing runtime errors.
- **Composable Primitives:** Provides `formControl`, `formGroup`, and `formArray` primitives that can be composed to create forms of any complexity.
- **Predictable State:** Emphasizes immutability and a clear data flow, making it easier to reason about form state.
- **Customizable Validation:** Supports synchronous validators with full type safety.
- **Dirty and Touched Tracking:** Built-in tracking of `dirty` and `touched` states for individual controls and aggregated states for groups and arrays.
- **Reconciliation:** Efficiently updates form state when underlying data changes (e.g., when receiving data from an API).
- **Extensible:** Designed to be easily extended with custom form controls and validation logic.
- **Framework Agnostic**: `form-core` can be used with any UI library

## Quick Start

1.  Install `@mmstack/form-core`.

    ```bash
    npm install @mmstack/form-core
    ```

2.  Start creating cool forms! :)

    ```typescript
    import { Component } from '@angular/core';
    import { formControl, formGroup } from '@mmstack/form-core';
    import { FormsModule } from '@angular/forms';

    @Component({
      selector: 'app-user-form',
      imports: [FormsModule],
      template: `
        <div>
          <label>
            Name:
            <input [value]="name.value()" (input)="name.value.set($any($event.target).value)" [class.invalid]="name.error() && name.touched()" (blur)="name.markAsTouched()" />
          </label>
        </div>
        <div>
          <label>
            Age:
            <input [(ngModel)]="age.value" type="number" [class.invalid]="age.error() && age.touched()" (blur)="age.markAsTouched()" />
            <span *ngIf="age.error() && age.touched()">{{ age.error() }}</span>
          </label>
        </div>
      `,
    })
    export class UserFormComponent {
      name = formControl('', {
        validator: () => (value) => (value ? '' : 'Name is required'),
      });
      age = formControl<number | undefined>(undefined, {
        //specify the type explicitely to have number type.
        validator: () => (value) => (value && value > 0 ? '' : 'Age must be a positive number'),
      });
    }
    ```

## In-depth

For an in-depth explanation of the primitives & how they work check out this article: [Fun-grained Reactivity in Angular: Part 2 - Forms](https://dev.to/mihamulec/fun-grained-reactivity-in-angular-part-2-forms-e84)
