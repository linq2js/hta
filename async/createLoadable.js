import { EMPTY_OBJECT } from "../core/types";
import { LOADABLE, LOADABLE_PROMISE } from "../core/types";
import isPromiseLike from "../core/isPromiseLike";

export default function createLoadable(value, options = EMPTY_OBJECT) {
  let props = {
    status: "loaded",
    value: !isPromiseLike(value) ? value : undefined,
    ...options,
  };

  if (isPromiseLike(value)) {
    props.status = "loading";
    props.promise = new Promise((resolve, reject) => {
      value.then(
        (value) => {
          if (props.status === "cancelled") return;
          props.status = "loaded";
          props.value = value;
          resolve(value);
          typeof props.onDone === "function" &&
            props.onDone(
              createLoadable(undefined, {
                status: "loaded",
                value,
              })
            );
        },
        (error) => {
          if (props.status === "cancelled") return;
          props.status = "failed";
          props.error = error;
          reject(error);
          typeof props.onDone === "function" &&
            props.onDone(
              createLoadable(undefined, {
                status: "failed",
                error,
              })
            );
        }
      );
    });
    props.promise.type = LOADABLE_PROMISE;
  }

  return {
    type: LOADABLE,
    get status() {
      return props.status;
    },
    get value() {
      if (props.status === "loading") {
        throw props.promise;
      }
      if (props.status === "failed") throw props.error;
      return props.value;
    },
    get error() {
      if (props.status === "loading") {
        throw props.promise;
      }
      return props.error;
    },
    tryGetValue(defaultValue) {
      if (props.status === "loading") {
        if (arguments.length) return defaultValue;
        if ("last" in props) {
          if (props.last.type === LOADABLE) {
            if (props.last.status === "loaded") return props.last.value;
            return props.value;
          }
          return props.last;
        }
      }
      return props.value;
    },
    map(selector) {
      if (props.status === "loaded") {
        return createLoadable(selector(props.value));
      }
      if (props.status === "failed") {
        return createLoadable(undefined, {
          status: "failed",
          error: props.error,
        });
      }
      return createLoadable(props.promise.then(selector));
    },
  };
}
