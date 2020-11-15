import { BINDER, FUNC, HOOKS, SCOPE } from "../core/types";

export default function useBinding(initial, twoWayBinding) {
  let { component, app } = SCOPE.current;
  function factory() {
    let value = initial;
    let removeListener;
    let api = {
      type: BINDER,
      watch(node, prop) {
        if (!removeListener) app.watch(watcher);
        if (twoWayBinding && typeof node !== FUNC) node[prop] = value;
        watchers.push({ node, prop });
      },
      get value() {
        return value;
      },
      set value(nextValue) {
        if (nextValue === value) return;
        value = nextValue;
        let i = watchers.length;
        while (i--) {
          let { node, prop } = watchers[i];
          node[prop] = value;
        }
        component.forceUpdate();
      },
    };
    let watchers = [];

    function watcher() {
      let i = watchers.length;
      let prev = value;
      while (i--) {
        let { node, prop } = watchers[i];
        typeof node === FUNC ? node(value) : (value = node[prop]);
      }
      if (prev !== value) component.forceUpdateAsync();
    }

    return {
      dispose() {
        removeListener && removeListener();
      },
      result: () => api,
    };
  }
  return component[HOOKS].get(BINDER, factory);
}
