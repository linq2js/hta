import createEmitter from "./createEmitter";
import { CHANGE } from "./types";

export default function createSimpleStore(initial = {}) {
  if (typeof initial.getState === "function") return initial;

  let state = initial;
  let emitter = createEmitter();

  function getState() {
    return state;
  }

  function dispatch(action, payload) {
    let next = action(state, payload);
    if (!next) return;
    if (next !== state) {
      state = next;
      emitter.emit(CHANGE);
    }
  }

  function subscribe(listener) {
    return emitter.on(CHANGE, listener);
  }

  return {
    getState,
    dispatch,
    subscribe,
  };
}
