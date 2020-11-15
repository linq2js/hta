import { createStore } from "./createStore";

export default function storeExtras(options) {
  return {
    store: {
      create(state) {
        return createStore(state, options.selectors);
      },
    },
  };
}
