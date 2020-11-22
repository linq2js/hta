import { FUNC, HOOKS, IMPERATIVE_HOOK, SCOPE } from "../core/types";
import useMemo from "./useMemo";

export default function useImperativeHandle(init, deps) {
  let handle = SCOPE.current.component[HOOKS].get(
    IMPERATIVE_HOOK,
    () => {
      let result = init();
      return {
        result: () => result,
      };
    },
    deps
  );
  let ref = SCOPE.current.props.ref;
  useMemo(() => {
    if (!ref) return;
    if (typeof ref === FUNC) return ref(handle);
    ref.current = handle;
    console.log(22)
  }, [handle, ref]);
}
