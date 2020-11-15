import createContentWrapper from "../core/createContentWrapper";
import createInstance from "../core/createInstance";
import createRenderer from "../core/createRenderer";
import { SUSPENSE } from "../core/types";

export default function suspense(fallback, content) {
  return createRenderer(function (app, context, parent, key, marker) {
    let instance = createInstance(parent, key, SUSPENSE, null, mount, [marker]);
    instance.update(app, context, fallback, content);
  });
}

function mount(marker) {
  let current = {};
  let wrappedContext;
  let instance = createContentWrapper(marker, { update });

  function render(context, content) {
    instance.render(current.app, context, content);
  }

  function handlePromise(promise) {
    instance.render(current.app, current.context, current.fallback);
    promise.finally(() => render(wrappedContext, current.content));
  }

  function update(app, context, fallback, content) {
    if (current.context !== context) {
      wrappedContext = { ...context, handlePromise };
    }
    current = { app, context, fallback, content };
    instance.render(current.app, wrappedContext, content);
  }

  return instance;
}
