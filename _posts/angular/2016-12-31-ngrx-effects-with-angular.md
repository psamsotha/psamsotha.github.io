---
layout: post
categories: angular
category: angular
title: "Using Effects in an Angular 2 NgRx Application"
description: "An introduction of how to incorporate ngrx/effects into your Angular ngrx applications."
thumb: need-air
tags: angular2 ngrx ngrx-effects
---

The first step in getting started with NgRx is to introduce `Store` in to the application, which is more than just a class, but a whole new way of thinking about state in our Angular applications. This article does not attempt to explain much about `Store`. If you don't have any experience working with `Store`, please take some time to visit [Comprehensive Introduction to @ngrx/store][store-intro]. The linked article IMO is the best out there for anyone new. It is as comprehensive as it gets. To get the most out of it, I recommend coding along.

In this article, I will introduce the NgRx [Effects][effects]  library, which is a compliment to Store. I will first do a quick walk through of what a simple login solution might look like only using Store, then I will introduce Effects into the mix. The main goal is get a clearer picture of how Effects actually fits in, and point out some of the benefits. The hardest part for me when starting, was to actually wrap my head around how it all fit together, so that's what I will do here: try to explain my understandings.

>**Note:** There is a complimentary example project to go along with this article. You can clone it from [GitHub][example-project].


{% include ads/in-article-ad.html %}


Let's first explain the problem domain. We want to create a simple login and then display the user after they have successfully logged in. The username display will first show the user as anonymous, then after login, show the user name and avatar. The result will look like the following:

#### Before Login

![before-login][before-login]


#### After Login

![after-login][after-login]

We'll first start by implementing this without using Effects. If you look at the [`@ngrx/store` project README][readme], you'll see the following description about the project:

>@ngrx/store is a controlled state container designed to help write performant, consistent applications on top of Angular. Core tenets:
>
>* State is a single immutable data structure
>* Actions describe state changes
>* Pure functions called reducers take the previous state and the next action to compute the new state
>* State accessed with the `Store`, an observable of state and an observer of actions

If you have worked with `Store` (which you should already have, if you are following along), these concepts should be familiar to you. So let's break each down into code.

In our simple login application, we will have only one state, which is the user state. The `UserState` will have the following properties

```typescript
export interface UserState {
  id: number;
  username: string;
  imageUrl: string;
  status: string;
}
```

As for the action that "describe[s] state changes" we will (for now) just have two actions, `LOAD_USER_FAILURE` and `LOAD_USER_SUCCESS`, and here is our action creator class

```typescript
export class UserActions {
  static readonly LOAD_USER_FAILURE = 'LOAD_USER_FAILURE';
  static readonly LOAD_USER_SUCCESS = 'LOAD_USER_SUCCESS';


  loadUserSuccess(user: UserData): Action {
    return {
      type: UserActions.LOAD_USER_SUCCESS,
      payload: {
        user
      }
    };
  }

  loadUserFailure(message: string): Action {
    return {
      type: UserActions.LOAD_USER_FAILURE,
      payload: {
        message
      }
    };
  }
}
```

Now for the reducer

```typescript
const initialState: UserState = new UserRecord() as UserState;

export const userReducer: ActionReducer<UserState>
    = (state = initialState, {type, payload}: Action) => {
  switch (type) {
    case UserActions.LOAD_USER_SUCCESS:
      const { user } = payload;
      return state.withMutations(currentUser => {
        currentUser
          .set('id', user.id)
          .set('username', user.username)
          .set('imageUrl', user.imageUrl)
          .set('status', USER_LOGGED_IN);
      });
    case UserActions.LOAD_USER_FAILURE:
      return initialState;

    default:
      return state;
  }
};
```

{% include ads/post-in-article-banner-1.html %}


Note that the previous two snippets are not consistent. The previous `UserState` interface was just an example to show the `UserState` properties. If you are trying to follow along at this point from the [linked example][example-project], you may be a little bit confused.

First of all the application does not show an example of this _initial_ implementation _not_ using effects. Secondly, the application uses Immutable.js to create some of the models, which might be a little confusing at first. But if you just keep in mind the properties of the `UserState` interface mentioned above, it should be pretty easy to still follow along in this article.

In the above reducer, just imagine that the `LOAD_USER_SUCCESS` action returns the new user state, and the `LOAD_USER_FAILED` returns the initial default user state. As this article is not mainly about store, these concepts should not be new to you. 

Now the last point in the quoted documentation is the state access through `Store`. For that, we will simply subscribe to the `user` state in the `AppComponent`

```typescript
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html'
})
export class AppComponent {
  user: Observable<User>;

  constructor(private store$: Store<AppState>) {
    this.user = this.store$.let(getUser());
  }
}
```

You might be used to seeing `store$.select('user')`, but here, I'm using the selector pattern and just using `let`. The result is the same. You can find the `getUser` in the `user.selectors` file (in the example app).

So now, we have our NgRx components in place, let's implement the login and see how it would normally be implemented without using Effects.

```typescript
@Component({
  selector: 'login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  constructor(private store$: Store<AppState>,
              private userActions: UserActions,
              private authService: AuthService) {}

  login(form: any) {
    this.authService.login({
      username: form.username,
      password: form.password
    })
    .subscribe((res: LoginResponse) => {
      if (res.isError) {
        this.store$.dispatch(this.userActions.loadUserFailure(res.message));
      } else {
        this.store$.dispatch(this.userActions.loadUserSuccess(res.user));
      }
    });
  }
}
```

As mentioned previously, this example is not in the example application. But you can see from the example, that we just login with the `AuthService`, and when we get the response, we either dispatch the `LOAD_USER_FAILURE` action with the error message, or we dispatch the `LOAD_USER_SUCCESS` action with the logged in user details.

This implementation would be how we would normally do it, without effects; the component (or maybe even the service) would be the one that dispatches the new action to update the user state.

When we introduce effects, what we would do is introduce a new action, that is not necessarily tied directly to any state, like in the case of the two previous user actions. The reason for this, is that the effect will subscribe to this new action, and in a way transform it. Let's see how the new `login` implementation will look like

```typescript
export class LoginComponent {

  constructor(private store$: Store<AppState>,
              private authActions: AuthActions) {}

  login(form: any) {
    this.store$.dispatch(this.authActions.login({
      username: form.username,
      password: form.password
    }));
  }
}
```

Here, we are introducing a new `LOGIN` action, that we will put in a new `AuthActions` class.

```typescript
export class AuthActions {
  static readonly LOGIN = 'LOGIN';

  login(credentials: Credentials): Action {
    return {
      type: AuthActions.LOGIN,
      payload: { credentials }
    };
  }
}
```

All the `login` method does now is dispatch the new `LOGIN` action, and the effect will subscribe to it, doing most of the legwork that would normally have been handled in the `login` method. And here is our effects class

```typescript
@Injectable()
export class AuthEffects {

  constructor(private authService: AuthService,
              private userActions: UserActions,
              private actions$: Actions) {}

  /**
    * On the LOGIN action, this effect will make a request to authenticate.
    * If not authenticated, it will emit a LOAD_USER_FAILURE action.
    * Otherwise, it will emit a LOAD_USER_SUCCESS action.
    */
  @Effect()
  login$ = this.actions$
    .ofType(AuthActions.LOGIN)
    .map(({payload}) => payload.credentials as Credentials)
    .switchMap(credentials => {
      return this.authService.login(credentials)
        .map((res: LoginResponse) => {
          if (res.isError) {
            return this.userActions.loadUserFailure(res.message);
          }
          return this.userActions.loadUserSuccess(res.user);
        });
    });
}
```

The `Actions` class is an Effects library API. It is a stream of _all_ the actions dispatched in our application. Here, our effect will subscribe to the `LOGIN` action. Each `LOGIN` action will have the credentials as the payload, and we will use [`Observable.switchMap`][switchMap] to make an authentication request, returning a new Observable that will either be mapped to the `LOAD_USER_SUCCESS` action or the `LOAD_USER_FAILED` action.

We don't need to do anything after this (e.g. subscribe to the `login$`). It is handle transparently. When the `LOGIN` action is dispatched, the result is like if we had manually dispatched one of the `LOAD_USER_XXX` actions.

And this is the basis of working with effects. We just dispatch an action that the effect subscribes to, and then the effect should perform some operation(s) and return a different Action observable.

I think one of the main benefits of doing it this way (instead of without effects) is the separation of concerns. This separation makes our components a lot simpler and easier to test. All the components do is subscribe to state and dispatch actions. This makes testing a breeze. No need to make a bunch of crazy mocks like we might normally do. It's also easier to reason about the side effects when they are all in one location.

And that's it. It takes a bit of practice to get used to this new way doing things, but in the end, I personally feel like it's a lot cleaner. I have noticed my tests getting a lot cleaner also.


[store-intro]: https://gist.github.com/btroncone/a6e4347326749f938510
[effects]: https://github.com/ngrx/effects
[example-project]: https://github.com/psamsotha/ngrx-effects-example
[before-login]: https://www.dropbox.com/s/vk4aeoh5y38vi9l/before-login.png?dl=1
[after-login]: https://www.dropbox.com/s/z0jqszeh9oe052z/after-login.png?dl=1
[readme]: https://github.com/ngrx/store/blob/master/README.md
[switchMap]: http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-switchMap
