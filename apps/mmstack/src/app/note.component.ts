import {
  ChangeDetectionStrategy,
  Component,
  input,
  isSignal,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  derived,
  DerivedSignal,
  formGroup,
  FormGroupSignal,
  injectCreateStringState,
  injectCreateTextareaState,
  StringFieldComponent,
  StringState,
  TextareaFieldComponent,
  TextareaState,
} from '@mmstack/form-material';

export type Note = {
  title: string;
  body: string;
};

type NoteState<TParent = undefined> = FormGroupSignal<
  Note,
  {
    title: StringState<Note>;
    body: TextareaState<Note>;
  },
  TParent
>;

export function injectCreateNoteState() {
  const stringFactory = injectCreateStringState();
  const textareaFactory = injectCreateTextareaState();
  return <TParent = undefined>(
    value: Note | DerivedSignal<TParent, Note>,
  ): NoteState<TParent> => {
    const valueSignal = isSignal(value) ? value : signal(value);

    const title = stringFactory(derived(valueSignal, 'title'), {
      label: () => 'Subject',
      validation: () => ({
        required: true,
        trimmed: true,
        maxLength: 100,
      }),
    });

    return formGroup(valueSignal, {
      title,
      body: textareaFactory(derived(valueSignal, 'body'), {
        label: () => 'Note',
        validation: () => ({
          required: true,
          trimmed: true,
          maxLength: 1000,
          not: title.value(), // cant be the same as title
        }),
      }),
    });
  };
}

@Component({
  selector: 'app-note',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, StringFieldComponent, TextareaFieldComponent],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ state().value().title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mm-string-field [state]="state().children().title" />
        <mm-textarea-field [state]="state().children().body" />
      </mat-card-content>
    </mat-card>
  `,
  styles: ``,
})
export class NoteComponent<TParent = undefined> {
  readonly state = input.required<NoteState<TParent>>();
}
