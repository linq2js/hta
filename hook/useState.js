import { EMPTY_ARRAY, FUNC, HOOKS, SCOPE, STATE_HOOK } from "../core/types";

export default function useState(initial) {
  let component = SCOPE.current.component;
  function factory() {
    let value = initial;

    function set(nextValue) {
      if (typeof nextValue === FUNC) {
        nextValue = nextValue(value);
      }
      if (nextValue === value) return;
      value = nextValue;
      component.updates
        ? component.forceUpdateAsync()
        : component.forceUpdate();
    }

    return {
      result: () => [value, set],
    };
  }
  return component[HOOKS].get(STATE_HOOK, factory, EMPTY_ARRAY);
}
