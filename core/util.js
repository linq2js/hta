import isPromiseLike from "./isPromiseLike";

export let slice = [].slice;
export let indexOf = [].indexOf;
export let isArray = Array.isArray;
export let enqueue1 = Promise.resolve().then.bind(Promise.resolve());
export let enqueue2 =
  typeof requestAnimationFrame === "undefined"
    ? enqueue1
    : requestAnimationFrame;

export function margeState(originalState, changes, promiseProcessor) {
  if (!changes || changes === originalState) return originalState;
  if (typeof changes === "function") changes = changes(originalState);
  let nextState = originalState;
  for (let prop in changes) {
    let value = changes[prop];
    // noinspection JSUnfilteredForInLoop
    if (nextState[prop] !== value) {
      if (nextState === originalState) {
        nextState = { ...originalState };
      }
      nextState[prop] =
        promiseProcessor && isPromiseLike(value)
          ? promiseProcessor(prop, value, nextState[prop])
          : value;
    }
  }
  return nextState;
}
