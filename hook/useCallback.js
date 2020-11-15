import { CALLBACK_HOOK, HOOKS, SCOPE } from "../core/types";

export default function useCallback(callback, deps) {
  return SCOPE.current.component[HOOKS].get(
    CALLBACK_HOOK,
    () => ({ result: () => callback }),
    deps
  );
}
