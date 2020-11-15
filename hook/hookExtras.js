import { HOOKS } from "../core/types";
import createHookManager from "./createHookManager";

export default function hookExtras() {
  return {
    component: {
      init({ instance }) {
        instance[HOOKS] = createHookManager();
      },
      updating(args) {
        args.instance[HOOKS].updating(args);
      },
      updated({ instance }) {
        instance[HOOKS].updated();
      },
      unmount({ instance }) {
        instance[HOOKS].unmount();
      },
    },
  };
}
