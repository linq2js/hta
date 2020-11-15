import { SCOPE } from "../core/types";
import useCallback from "./useCallback";

export default function useAction(action, defaultPayload) {
  let store = SCOPE.current.app.store;
  return useCallback(
    function () {
      return store.dispatch(
        action,
        arguments.length ? arguments[0] : defaultPayload
      );
    },
    [action, defaultPayload]
  );
}
