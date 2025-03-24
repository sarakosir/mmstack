import {
  Component,
  inject,
  Injectable,
  isDevMode,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { derived, formControl, formGroup } from '@mmstack/form-core';
import {
  createCircuitBreaker,
  mutationResource,
  queryResource,
} from '@mmstack/resource';

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly endpoint = 'https://jsonplaceholder.typicode.com/posts';
  private readonly cb = createCircuitBreaker();
  readonly posts = queryResource<Post[]>(
    () => ({
      url: this.endpoint,
    }),
    {
      keepPrevious: true, // keep data between requests
      refresh: 5 * 60 * 1000, // refresh every 5 minutes
      circuitBreaker: this.cb, // use shared circuit breaker use true if not sharing
      retry: 3, // retry 3 times on error using default backoff
      onError: (err) => {
        if (!isDevMode()) return;
        console.error(err);
      }, // log errors in dev mode
      defaultValue: [],
    },
  );

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
        const prev = untracked(this.posts.value);
        this.posts.set([...prev, post]); // optimistically update
        return prev;
      },
      onError: (err, prev) => {
        if (isDevMode()) console.error(err);
        this.posts.set(prev); // rollback on error
      },
      onSuccess: (next) => {
        this.posts.update((posts) =>
          posts.map((p) => (p.id === next.id ? next : p)),
        ); // replace with value from server
      },
    },
  );

  createPost(post: Post) {
    this.createPostResource.mutate({ body: post }); // send the request
  }
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: `
    <input
      [value]="testForm.children().name.value()"
      (input)="testForm.children().name.value.set($any($event).target.value)"
    />
    {{ testForm.children().name.value() }}
  `,
})
export class AppComponent {
  readonly svc = inject(PostsService);

  protected readonly test = signal({
    name: 'test',
    age: 1,
  });

  protected readonly testForm = formGroup(this.test, {
    name: formControl(derived(this.test, 'name')),
    age: formControl(derived(this.test, 'age')),
  });
}
