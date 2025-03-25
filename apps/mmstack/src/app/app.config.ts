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
