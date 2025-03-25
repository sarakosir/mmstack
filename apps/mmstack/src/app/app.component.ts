import {
  Component,
  computed,
  effect,
  Injectable,
  isDevMode,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  derived,
  formControl,
  FormControlSignal,
  formGroup,
  FormGroupSignal,
} from '@mmstack/form-core';
import { debounced } from '@mmstack/primitives';
import { mutationResource, queryResource } from '@mmstack/resource';

type Post = {
  id: number;
  title?: string;
  body?: string;
};

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly endpoint = 'https://jsonplaceholder.typicode.com/posts';

  readonly id = signal(1);

  readonly post = queryResource<Post>(
    () => ({
      url: `${this.endpoint}/${this.id()}`,
    }),
    {
      keepPrevious: true,
      cache: true,
    },
  );

  next() {
    this.id.update((id) => id + 1);
  }

  prev() {
    this.id.update((id) => id - 1);
  }

  private readonly createPostResource = mutationResource(
    () => ({
      url: this.endpoint,
      method: 'POST',
    }),
    {
      onMutate: (post: Post) => {
        const prev = untracked(this.post.value);
        this.post.set({ ...prev, ...post });
        return prev;
      },
      onError: (err, prev) => {
        if (isDevMode()) console.error(err);
        this.post.set(prev); // rollback on error
      },
      onSuccess: (next) => {
        this.post.set(next);
      },
    },
  );

  readonly loading = computed(
    () => this.createPostResource.isLoading() || this.post.isLoading(),
  );

  createPost(post: Post) {
    this.createPostResource.mutate({
      body: post,
    }); // send the request
  }

  updatePost(id: number, post: Partial<Post>) {
    this.createPostResource.mutate({
      body: { id, ...post },
      url: `${this.endpoint}/${id}`,
      method: 'PATCH',
    }); // send the request
  }
}

type PostState = FormGroupSignal<
  Post,
  {
    title: FormControlSignal<string | undefined, Post>;
    body: FormControlSignal<string | undefined, Post>;
  }
>;

function createPostState(post: Post, loading: Signal<boolean>): PostState {
  const value = signal<Post>(post);

  return formGroup(value, {
    title: formControl(derived(value, 'title'), {
      label: () => 'Title',
      readonly: loading,
      validator: () => (value) => (value ? '' : 'Title is required'),
    }),
    body: formControl(derived(value, 'body'), {
      label: () => 'Body',
      readonly: loading,
      validator: () => (value) => {
        if (value && value.length > 255) return 'Body is too long';
        return '';
      },
    }),
  });
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: ` <input [(ngModel)]="value" /> `,
})
export class AppComponent {
  protected readonly value = debounced('yay');

  e = effect(() => console.log(this.value()));
}
