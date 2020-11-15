import { HOOKS, MEMO_HOOK, SCOPE } from "../core/types";

export default function useMemo(factory, deps) {
  return SCOPE.current.component[HOOKS].get(
    MEMO_HOOK,
    () => {
      let value = factory.apply(null, deps);
      return { result: () => value };
    },
    deps
  );
}
