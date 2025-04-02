import {
  HttpInterceptorFn,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideValidatorConfig } from '@mmstack/form-material';
import {
  createCacheInterceptor,
  createDedupeRequestsInterceptor,
  provideQueryCache,
} from '@mmstack/resource';
import { DateTime } from 'luxon';
import { delay } from 'rxjs';
import { appRoutes } from './app.routes';

function createDelayInterceptor(): HttpInterceptorFn {
  return (req, next) => {
    return next(req).pipe(delay(1000));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeHeaders: [
          'Authorization',
          'Cache-Control',
          'ETag',
          'Last-Modified',
        ],
      }),
    ),
    provideValidatorConfig<DateTime>(
      (locale) => {
        switch (locale) {
          case 'sl-SI':
            return {
              general: {
                required: (label = 'Polje') => `${label} je obvezno`,
                not: (value) => `Ne sme biti ${value}`,
                oneOf: (value) => `Mora biti eden od: ${value}`,
                notOneOf: (value) => `Ne sme biti eden od: ${value}`,
                mustBe: (value) => `Mora biti ${value}`,
                mustBeNull: () => `Mora biti prazno`,
              },
              boolean: {
                mustBeTrue: () => `Mora biti sprejeto`,
              },
              array: {
                minLength: (min, itemLabel = 'elementov') =>
                  `Mora imeti vsaj ${min} ${itemLabel}`,
                maxLength: (max, itemLabel = 'elementov') =>
                  `Mora imeti največ ${max} ${itemLabel}`,
              },
              string: {
                email: () => `Ni veljaven e-poštni naslov`,
                uri: () => `Ni veljavna povezava`,
                trimmed: () => `Ne sme imeti začetnih ali končnih presledkov`,
                minLength: (min) => `Mora imeti vsaj ${min} znakov`,
                maxLength: (max) => `Mora imeti največ ${max} znakov`,
                isString: () => `Mora biti niz`,
                pattern: (pattern) => `Ne ustreza vzorcu ${pattern}`,
              },
              number: {
                isNumber: () => `Mora biti število`,
                integer: () => `Mora biti celo število`,
                multipleOf: (multiple) => `Mora biti deljivo z ${multiple}`,
                min: (min) => `Mora biti večje od ${min}`,
                max: (max) => `Mora biti manjše od ${max}`,
              },
              date: {
                isDate: () => `Mora biti datum`,
                min: (min) => `Mora biti po ${min}`,
                max: (max) => `Mora biti pred ${max}`,
              },
              merge: (errors) => {
                const first = errors.at(0);

                if (!first)
                  return {
                    error: '',
                    tooltip: '',
                  };

                if (errors.length === 1) {
                  return {
                    error: first,
                    tooltip: '',
                  };
                }

                return {
                  error: `${first}, +${errors.length} problemov`,
                  tooltip: errors.join('\n'),
                };
              },
            };
          default:
            return;
        }
      },
      (d) => {
        if (typeof d === 'string') return DateTime.fromISO(d).toJSDate();
        return d.toJSDate();
      },
    ),

    provideLuxonDateAdapter(),
    provideExperimentalZonelessChangeDetection(),
    provideQueryCache(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        createCacheInterceptor(),
        createDedupeRequestsInterceptor(),
        createDelayInterceptor(),
      ]),
    ),
    provideRouter(appRoutes),
    provideValidatorConfig(
      (locale) => {
        switch (locale) {
          case 'sl-SI':
            return {
              general: {
                required: () => 'To polje je obvezno',
              },
            };
          default: {
            return {
              general: {
                required: (label) => `This ${label} is required`,
              },
            };
          }
        }
      },
      // provide a custom toDate function if you're using non-date objects like Luxon's DateTime or Moment
      (date) => new Date(date),
    ),
  ],
};
