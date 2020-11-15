import isPromiseLike from "../core/isPromiseLike";

export default function asyncExtras() {
  return {
    component: {
      error({ error, context }) {
        if (isPromiseLike(error) && context.handlePromise)
          return context.handlePromise(error);
        throw error;
      },
    },
  };
}
