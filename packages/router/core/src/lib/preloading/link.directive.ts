import {
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injectable,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import {
  NoPreloading,
  PreloadAllModules,
  PreloadingStrategy,
  Route,
  Router,
  RouterLink,
  RouterLinkWithHref,
  RouterPreloader,
  type ActivatedRoute,
  type Params,
  type UrlTree,
} from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { flattenRoutes } from './flat-routes';

export function hasSlowConnection() {
  if (
    globalThis.window &&
    'navigator' in globalThis.window &&
    'connection' in globalThis.window.navigator &&
    typeof globalThis.window.navigator.connection === 'object' &&
    !!globalThis.window.navigator.connection &&
    'effectiveType' in globalThis.window.navigator.connection &&
    typeof globalThis.window.navigator.connection.effectiveType === 'string'
  )
    return globalThis.window.navigator.connection.effectiveType.endsWith('2g');

  return false;
}

const HAS_SLOW_CONNECTION = hasSlowConnection();

function noPreload(route: Route) {
  return route.data && route.data['preload'] === false;
}

@Injectable({
  providedIn: 'root',
})
export class PreloadLinkStrategy implements PreloadingStrategy {
  private readonly routeMap = flattenRoutes(inject(Router).config);
  preload(route: Route, _: () => Observable<any>): Observable<any> {
    if (HAS_SLOW_CONNECTION || noPreload(route)) return EMPTY;
    return EMPTY;
  }
}

function observerSupported() {
  return typeof IntersectionObserver !== 'undefined';
}

function injectPreloader(): RouterPreloader | null {
  const strategy = inject(PreloadingStrategy, {
    optional: true,
  });

  if (
    !strategy ||
    strategy instanceof NoPreloading ||
    strategy instanceof PreloadAllModules
  )
    return null;

  return inject(RouterPreloader, {
    optional: true,
  });
}

@Injectable({
  providedIn: 'root',
})
export class VisibleLinkHandler {
  private readonly map = new WeakMap<Element, () => void>();
  private readonly observer: IntersectionObserver | null = observerSupported()
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          this.map.get(entry.target)?.();
          this.observer?.unobserve(entry.target);
        });
      })
    : null;

  register(el: Element, onVisible: () => void) {
    if (!this.observer)
      return () => {
        // noop
      };

    this.map.set(el, onVisible);
    this.observer.observe(el);

    return () => {
      this.map.delete(el);
      this.observer?.unobserve(el);
    };
  }
}

@Directive({
  selector: '[mmLink]',
  exportAs: 'mmLink',
  host: {
    '(mouseenter)': 'onHover()',
  },
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
export class LinkDirective {
  private readonly routerLink =
    inject(RouterLink, {
      self: true,
      optional: true,
    }) ?? inject(RouterLinkWithHref, { self: true, optional: true });

  private readonly preloader = injectPreloader();
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
  readonly preloadOn = input<null | 'hover' | 'visible'>(null);

  protected onHover() {
    if (untracked(this.preloadOn) !== 'hover') return;
    if (!this.preloader) {
      if (isDevMode())
        console.error(
          'Preloader not available, please configure a preloading strategy',
        );
      return;
    }

    this.preloader?.preload().subscribe();
  }

  protected onVisible() {
    if (untracked(this.preloadOn) !== 'visible') return;
    if (!this.preloader) {
      if (isDevMode())
        console.error(
          'Preloader not available, please configure a preloading strategy',
        );
      return;
    }
  }

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef, {
      self: true,
    });
    const unsub = inject(VisibleLinkHandler).register(
      el.nativeElement,
      (() => {
        this.onVisible();
      }).bind(this),
    );

    inject(DestroyRef).onDestroy(() => unsub());
  }

  onClick(
    button: number,
    ctrlKey: boolean,
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean,
  ) {
    return this.routerLink?.onClick(button, ctrlKey, shiftKey, altKey, metaKey);
  }
}
