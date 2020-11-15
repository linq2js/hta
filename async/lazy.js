import createRenderer from "../core/createRenderer";
import renderContent from "../core/renderContent";
import {FUNC} from "../core/types";

export default function lazy(fn, fallback) {
  let hasFallback = arguments.length > 1;
  let promise;
  let resolved;

  return createRenderer((app, context, parent, key, marker, props) => {
    if (!promise) {
      promise = fn().then((result) => {
        resolved = {
          component:
            result && typeof result.default === FUNC
              ? result.default
              : typeof result === FUNC
              ? result
              : undefined,
        };
        renderContent(app, context, parent, key, marker, [
          resolved.component,
          props,
        ]);
      });
    }
    if (!resolved) {
      if (!hasFallback) return;
      return renderContent(app, context, parent, key, marker, fallback);
    }
    renderContent(app, context, parent, key, marker, [
      resolved.component,
      props,
    ]);
  });
}
