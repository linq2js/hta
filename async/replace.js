import createContentWrapper from "../core/createContentWrapper";
import createInstance from "../core/createInstance";
import createRenderer from "../core/createRenderer";
import { EMPTY_OBJECT, REPLACE } from "../core/types";
import handleGenerator from "./handleGenerator";

export default function replace(iterator, options = EMPTY_OBJECT) {
  return createRenderer(function (app, context, parent, key, marker) {
    let instance = createInstance(
      parent,
      key,
      REPLACE,
      (x) => x.iterator !== iterator,
      mount,
      [marker]
    );
    instance.update(app, context, iterator, options);
  });
}

function mount(marker) {
  let instance = createContentWrapper(marker, {
    update,
  });

  function update(app, context, iterator, options) {
    if (instance.iterator) return;
    let { resolve, reject } = options;
    instance.iterator = iterator;
    handleGenerator(iterator, {
      onYield: (value) =>
        instance.render(app, context, resolve ? resolve(value) : value),
      onError: (error) =>
        reject
          ? instance.render(app, context, reject(error))
          : app.extras.component.error(error),
    });
  }

  return instance;
}
