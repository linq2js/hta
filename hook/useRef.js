import { HOOKS, SCOPE } from "../core/types";

export default function useRef(initial) {
  return SCOPE.current.component[HOOKS].ref(initial);
}
