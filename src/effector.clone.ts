import { useEffect, useState } from "react";

interface Effect<P, R, E> {
  (): Promise<R>;
  (): Promise<E>;
  (payload: P): Promise<R>;
  (payload: P): Promise<E>;
  doneData: Event<R>;
  failData: Event<E>;
}

interface EffectCallbackDone<P, R> {
  (): Promise<R>;
  (payload: P): Promise<R>;
}

interface EffectCallbackFail<P, E> {
  (): Promise<E>;
  (payload: P): Promise<E>;
}

interface Event<P> {
  (): void;
  (payload: P): void;
  watch(cb: (newPayload: P) => void): () => void;
  stores: Store<any>[];
}

interface Store<S> {
  getState(): S;
  on<P>(event: Event<P>, cb: (prevState: S, payload: P) => S): Store<S>;
  dispatch<P>(event: Event<P>, payload: P): void;
  watch(cb: (newState: S) => void): () => void;
  reset<P>(event: Event<P>): Store<S>;
}

export const createStore = <S>(initState: S) => {
  let watchers: ((newState: S, payload: any) => void)[] = [];
  const events = new Map<Event<any>, Function>();
  let state = initState;

  const store: Store<S> = {
    getState: () => state,
    on(event, cb) {
      events.set(event, cb);
      event.stores.push(this);

      return this;
    },
    reset(event) {
      this.on(event, () => initState);
      return this;
    },
    dispatch(event, payload) {
      const callback = events.get(event);

      if (callback) {
        const newState = callback(state, payload);

        if (newState !== state) {
          state = newState;
        }
      }

      watchers.forEach((cb) => cb(state, payload));
    },
    watch(cb) {
      watchers.push(cb);

      return () => {
        watchers = watchers.filter((i) => i !== cb);
      };
    }
  };

  return store;
};

export const createEvent = <P>() => {
  let watchers: ((payload: P) => void)[] = [];

  const event: Event<P> = (payload) => {
    event.stores.forEach((store) => store.dispatch(event, payload));
    watchers.forEach((cb) => cb(payload));
  };

  event.stores = [];

  event.watch = (cb) => {
    watchers.push(cb);

    return () => {
      watchers = watchers.filter((i) => i !== cb);
    };
  };

  return event;
};

export const createEffect = <P, R, E extends Error>(
  cb: EffectCallbackDone<P, R> | EffectCallbackFail<P, E>
) => {
  const doneData = createEvent<R>();
  const failData = createEvent<E>();

  const effect: Effect<P, R, E> = (payload) => {
    cb(payload).then(doneData).catch(failData);
  };

  effect.doneData = doneData;
  effect.failData = failData;

  return effect;
};

export const useStore = <S>(store: Store<S>) => {
  const [state, setState] = useState<S>(store.getState);

  useEffect(() => {
    const unsubscribe = store.watch(setState);

    return unsubscribe;
  }, [store]);

  return state;
};
