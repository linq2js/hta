import createContentWrapper from "../core/createContentWrapper";
import createInstance from "../core/createInstance";
import createRenderer from "../core/createRenderer";
import { PROVIDER, SCOPE } from "../core/types";

export default function createContext(defaultValue) {
  let id = Symbol();

  function provide() {
    let [value, content] =
      arguments.length > 1 ? arguments : [defaultValue, arguments[0]];
    return createRenderer(function (app, context, parent, key, marker) {
      let instance = createInstance(
        parent,
        key,
        PROVIDER,
        (x) => x.id !== id,
        mount,
        [app, context, parent, key, marker]
      );
      instance.update(value, content);
    });
  }

  function mount(app, context, parent, key, marker) {
    let instance = createContentWrapper(marker, {
      id,
      consumers: new Set(),
      value: defaultValue,
      update,
    });

    function update(value, content) {
      let prevInstance = context[id];
      let oldConsumers;
      try {
        context[id] = instance;
        if (instance.value !== value) {
          // keep old consumers for late on
          oldConsumers = [...instance.consumers];
          instance.consumers = new Set();
          instance.value = value;
        }
        instance.render(app, context, content);
      } finally {
        if (oldConsumers && oldConsumers.length) {
          // we must update consumers which is not rendered in current rendering phase
          // because the wrappers of those consumers might not be rendered (their props was not changed)
          let i = oldConsumers.length;
          while (i--) {
            if (instance.consumers.has(oldConsumers[i])) continue;
            oldConsumers[i].forceUpdate();
          }
        }
        context[id] = prevInstance;
      }
    }

    return instance;
  }

  function consume() {
    let context = SCOPE.current.context[id];
    if (!context) return arguments.length ? arguments[0] : defaultValue;
    context.consumers.add(SCOPE.current.component);
    return context.value;
  }

  return [provide, consume];
}
