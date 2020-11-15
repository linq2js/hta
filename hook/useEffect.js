import { EFFECT_HOOK, FUNC, HOOKS, NOOP, SCOPE } from "../core/types";

export default function useEffect(effect, deps) {
  let hooks = SCOPE.current.component[HOOKS];
  function factory() {
    let dispose;
    hooks.onUpdated(() => (dispose = effect()));
    return {
      dispose: () => typeof dispose === FUNC && dispose(),
      result: NOOP,
    };
  }
  return hooks.get(EFFECT_HOOK, factory, deps);
}
