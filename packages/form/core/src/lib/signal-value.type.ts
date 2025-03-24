import { type Signal } from '@angular/core';

export type SignalValue<T> = T extends Signal<infer U> ? U : never;
