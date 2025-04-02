import { booleanAttribute, Directive, input } from '@angular/core';
import {
  RouterLink,
  type ActivatedRoute,
  type Params,
  type UrlTree,
} from '@angular/router';

@Directive({
  selector: '[mmLink]',
  exportAs: 'mmLink',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: [
        'routerLink: mmLink',
        'target',
        'queryParams',
        'fragment',
        'queryParamsHandling',
        'state',
        'relativeTo',
        'skipLocationChange',
        'replaceUrl',
      ],
    },
  ],
})
export class Link {
  readonly target = input<string>();
  readonly queryParams = input<Params>();
  readonly fragment = input<string>();
  readonly queryParamsHandling = input<'merge' | 'preserve' | ''>();
  readonly state = input<Record<string, any>>();
  readonly info = input<unknown>();
  readonly relativeTo = input<ActivatedRoute>();
  readonly skipLocationChange = input(false, { transform: booleanAttribute });
  readonly replaceUrl = input(false, { transform: booleanAttribute });
  readonly mmLink = input.required<string | any[] | UrlTree>();
}
