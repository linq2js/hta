import { NOOP, SELECTOR } from "../core/types";
import { isArray } from "../core/util";

export default function createSelector(selector, resolver) {
  if (typeof selector === "function") {
    if (selector.type === SELECTOR) return selector;

    let lastArgs;
    let lastResult;
    return Object.assign(
      function (...args) {
        if (
          !lastArgs ||
          lastArgs.length !== args.length ||
          lastArgs.some((arg, index) => args[index] !== arg)
        ) {
          try {
            if (lastResult && typeof lastResult.cancel === "function") {
              lastResult.cancel();
            }
            let result = selector(...args);
            if (typeof result === "function") {
              if (resolver && typeof resolver.thunk === "function") {
                lastResult = resolver.thunk(result, lastResult, lastArgs);
              } else {
                lastResult = result(lastResult, lastArgs);
              }
            } else {
              lastResult = result;
            }
          } finally {
            lastArgs = args;
          }
        }
        return lastResult;
      },
      {
        type: SELECTOR,
      }
    );
  }
  if (typeof selector === "string") {
    let runtimeSelector = NOOP;
    return function () {
      if (runtimeSelector === NOOP) {
        runtimeSelector = resolver(selector);
      }
      if (!runtimeSelector)
        throw new Error("No named selector " + selector + " found");
      return runtimeSelector(...arguments);
    };
  }

  if (isArray(selector)) {
    if (selector.length === 1 && isArray(selector[0])) {
      let literal = selector[0][0];
      return () => literal;
    }
    let combiner = selector[selector.length - 1];
    let selectors = selector
      .slice(0, selector.length - 1)
      .map((s) => createSelector(s, resolver));
    let wrappedCombiner = createSelector(combiner, resolver);
    return createSelector(function () {
      return wrappedCombiner(...selectors.map((s) => s(...arguments)));
    }, resolver);
  }

  if (selector && typeof selector === "object") {
    let entries = Object.entries(selector).map(([key, subSelector]) => [
      key,
      createSelector(subSelector, resolver),
    ]);
    let prev;
    return createSelector(function () {
      let result = {};
      let hasChange = !prev;
      entries.forEach(([key, selector]) => {
        let value = selector(...arguments);
        if (!hasChange && prev[key] !== value) {
          hasChange = true;
        }
        result[key] = value;
      });
      return hasChange ? (prev = result) : prev;
    }, resolver);
  }

  throw new Error(
    "Invalid selector type. Expected Array | String | Function but got " +
      typeof selector
  );
}
