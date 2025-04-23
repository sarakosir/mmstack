/**
 * Represents the known locales for the application.
 * Library consumers should augment this interface in their own projects
 * to add their specific locales using declaration merging.
 * Value types don't really matter, only the keys are used.
 *
 * @example
 * // In your's project (e.g., src/app/types/locale.d.ts)
 * declare module '@mmstack/translate' {
 * interface SupportedLocales {
 *    'en-US': string;
 *    'de-DE': string;
 *    'fr-CA': string;
 *   }
 * }
 */
export interface SupportedLocales {
  'en-US': string;
}

type AssertStringKey<T> = T extends string ? T : never;

export type Locale = AssertStringKey<keyof SupportedLocales>;
