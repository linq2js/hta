import createContentWrapper from "../core/createContentWrapper";
import createInstance from "../core/createInstance";
import createRenderer from "../core/createRenderer";
import { EMPTY_OBJECT, UNTIL } from "../core/types";

export default function until(promise, options = EMPTY_OBJECT) {
  return createRenderer(function (app, context, parent, key, marker) {
    let instance = createInstance(
      parent,
      key,
      UNTIL,
      (x) => x.promise !== promise,
      mount,
      [marker]
    );
    instance.update(app, context, promise, options);
  });
}

function mount(marker) {
  let instance = createContentWrapper(marker, {
    status: "pending",
    update,
  });

  function update(app, context, promise, { fallback, resolve, reject }) {
    function handleSuccess(value) {
      if (instance.unmounted) return;
      instance.status = "resolved";
      instance.value = value;
      instance.render(app, context, resolve ? resolve(value) : value);
    }

    function handleError(error) {
      if (instance.unmounted) return;
      instance.status = "rejected";
      instance.error = error;
      reject
        ? instance.render(app, context, reject(error))
        : app.extras.component.error(error);
    }

    if (instance.status !== "pending") {
      instance.status === "resolved"
        ? handleSuccess(instance.value)
        : handleError(instance.error);
      return;
    }

    instance.promise = promise;
    instance.status = "pending";
    instance.value = undefined;
    instance.error = undefined;
    instance.render(app, context, fallback);

    promise.then(handleSuccess, handleError);
  }

  return instance;
}
