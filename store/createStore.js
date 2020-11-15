import createLoadable from "../async/createLoadable";
import createEmitter from "../core/createEmitter";
import isPromiseLike from "../core/isPromiseLike";
import { CHANGE, EMPTY_OBJECT } from "../core/types";
import { isArray, margeState } from "../core/util";
import createSelector from "./createSelector";

let cachedMethods = {};

export function createStore(initial, selectors) {
  if (
    initial &&
    (typeof initial.dispatch === "function" ||
      typeof initial.getState === "function")
  ) {
    return initial;
  }

  let originalState;
  let dispatchingScopes = 0;
  let pendingChanges;
  let updateTimer;
  let state = EMPTY_OBJECT;
  let selectorMap = {};
  let emitter = createEmitter();
  let changeEmitter = emitter.get(CHANGE);

  function resolvePropValue(obj, prop) {
    // is method invoking
    if (prop.charAt(prop.length - 1) === ")") {
      let cachedMethodInvoking = cachedMethods[prop];
      if (!cachedMethodInvoking) {
        let [method, rawArgs] = prop.split(/[()]/);
        cachedMethodInvoking = cachedMethods[prop] = {
          method,
          args: rawArgs.split(",").map((x) => x.trim()),
        };
      }
      return obj[cachedMethodInvoking.method](...cachedMethodInvoking.args);
    }
    return obj[prop];
  }

  function resolveSelector(name) {
    let selector = selectorMap[name];
    if (!selector) {
      let props = name.match(/(\([^)]*\)|[^.])+/g);
      selectorMap[name] = selector = (state) =>
        props.reduce((prev, prop) => resolvePropValue(prev, prop), state);
    }
    return selector;
  }

  function lazyUpdateState(changes) {
    clearTimeout(updateTimer);
    pendingChanges = { ...pendingChanges, ...changes };
    updateTimer = setTimeout(updateState, 0, pendingChanges);
  }

  function handlePromise(prop, promise, last) {
    return createLoadable(promise, {
      last,
      onDone(loadable) {
        state[prop] === promise && lazyUpdateState({ [prop]: loadable });
      },
    });
  }

  function updateState(changes) {
    state = margeState(state, changes, handlePromise);
  }

  function bulkDispatch(actions) {
    for (let i = 0; i < actions.length; i++) {
      if (!isArray(actions[i])) {
        throw new Error(
          "Expect tuple [action, payload] but got " + typeof actions[i]
        );
      }
      dispatch(actions[i][0], actions[i][1]);
    }
  }

  function dispatch(action, payload) {
    try {
      if (!dispatchingScopes) {
        originalState = state;
      }
      dispatchingScopes++;
      if (isArray(action)) {
        if (action.length > 1) {
          if (typeof action[1] === "function") {
            payload = action[1](payload);
          } else {
            payload = action[1];
          }
        }
        action = action[0];
      }

      if (typeof action !== "function") return action;

      // support async payload
      if (isPromiseLike(payload)) {
        return payload.then((resolved) => dispatch(action, resolved));
      }

      let result = action(state, payload);

      if (!result) return result;

      // for async action, we support only action dispatching, no state updating
      // async function Action() {
      //    return [action, payload]
      //    return action
      // }
      if (isPromiseLike(result)) {
        return result.then(dispatch, dispatch);
      }

      if (typeof result === "function") return dispatch(result);

      if (isArray(result)) {
        // update state and dispatch action later on
        // [changes, action, payload?]
        if (typeof result[0] !== "function") {
          if (isArray(result[0])) return bulkDispatch(result);
          updateState(result[0]);
          // multiple actions
          if (isArray(result[1])) return bulkDispatch(result.slice(1));
          return dispatch(...result.slice(1));
        }

        return dispatch(...result);
      }

      if (result && typeof result === "object") {
        updateState(result);
      }
    } finally {
      dispatchingScopes--;
      if (!dispatchingScopes && originalState !== state)
        changeEmitter.emit(state);
    }
  }

  if (selectors) {
    for (let key in selectors) {
      let fn = selectors[key];
      let selector = createSelector(fn, resolveSelector);
      state[key] = selectorMap[key] = () => selector(state);
    }
  }

  if (initial) updateState(initial);

  return {
    // define API that compatibles with redux store
    getState() {
      return state;
    },
    subscribe(listener) {
      return changeEmitter.on(listener);
    },
    dispatch,
  };
}
