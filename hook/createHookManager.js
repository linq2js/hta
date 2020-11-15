import arrayEqual from "../core/arrayEqual";
import {EMPTY_ARRAY, FUNC, REF_HOOK} from "../core/types";

export default function createHookManager() {
  let index = -1;
  let currentCount = 0;
  let prevCount = undefined;
  let unsubscribeDestroyEvent;
  let disposeCount = 0;
  let hooks = [];
  let updated = [];

  return {
    onUpdated(listener) {
      updated[updated.length] = listener;
    },
    updated() {
      for (let i = 0; i < updated.length; i++) updated[i]();
    },
    updating() {
      if (typeof prevCount !== "undefined" && currentCount !== prevCount) {
        throw new Error(
          `Invalid hook usages. Previous: ${prevCount}, Current: ${currentCount}`
        );
      }
      updated = [];
      prevCount = currentCount;
      index = -1;
    },
    ref(initial) {
      index++;
      let hook = hooks[index];
      if (!hook) {
        hooks[index] = hook = {
          type: REF_HOOK,
          value: {
            current: typeof initial === FUNC ? initial() : initial,
          },
        };
      }
      return hook.value;
    },
    unmount() {
      if (!disposeCount) return;
      for (let i = 0; i < hooks.length; i++) {
        if (typeof hooks[i].dispose === "function") {
          hooks[i].dispose();
        }
      }
    },
    get(type, initial, deps = EMPTY_ARRAY) {
      index++;
      let hook = hooks[index];
      if (hook) {
        if (hook.type !== type) throw new Error("Invalid hook order");
        // re-create hook if deps changed
        if (
          deps === false ||
          hook.deps === false ||
          !arrayEqual(hook.deps, deps)
        ) {
          if (hook && hook.dispose) {
            disposeCount--;
            if (!disposeCount && unsubscribeDestroyEvent) {
              unsubscribeDestroyEvent();
              unsubscribeDestroyEvent = undefined;
            }
            hook.dispose();
          }
          hook = undefined;
        }
      }
      if (!hook) {
        hooks[index] = hook = { type, deps, ...initial() };
        hook.dispose && disposeCount++;
      }
      return hook.result();
    },
  };
}
