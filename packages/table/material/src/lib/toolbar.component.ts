import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GlobalFilteringFeature } from '@mmstack/table-core';
import { StringFieldComponent } from '@mmstack/form-material';

@Component({
  selector: 'mm-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StringFieldComponent],
  template: `
    <mm-string-field
      appearance="outline"
      [state]="globalFilterState()"
    />
  `,
  styles: ``,
})
export class ToolbarComponent {
  readonly globalFilterState = input.required<GlobalFilteringFeature>();
}
