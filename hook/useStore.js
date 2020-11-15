import { SCOPE } from "../core/types";

export default function useStore(selector) {
  if (!arguments.length) return SCOPE.current.app.store;
  return SCOPE.current.component.select(selector);
}
