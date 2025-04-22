import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-demo-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  template: `
    <div class="demo-home-container">
      <h1>MMStack Demos</h1>
      <p>Welcome to the MMStack demo section. Here you can explore various components and features of the MMStack library.</p>

      <div class="demo-cards">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Table Demo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              Explore the table component with sample data. This demo shows how to use the table component with pagination, sorting, and filtering.
            </p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-raised-button color="primary" routerLink="/demo/table">View Demo</a>
          </mat-card-actions>
        </mat-card>

        <!-- Additional demo cards can be added here in the future -->
      </div>
    </div>
  `,
  styles: `
    .demo-home-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-card-content {
      flex-grow: 1;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
    }
  `
})
export class DemoHomeComponent {
}
