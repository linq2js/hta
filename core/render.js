import createEmitter from "./createEmitter";
import createMarker from "./createMarker";
import createSimpleStore from "./createSimpleStore";
import defaultErrorBoundary from "./defaultErrorBoundary";
import renderComponent from "./renderComponent";
import renderContent from "./renderContent";
import { DOC, FUNC, INNER, NOOP, WATCH } from "./types";
import { enqueue2, isArray } from "./util";

export default function render(content, options = {}) {
  let { state, container, use, onLoad, onChange, onUpdate } = options;
  if (typeof container === "string") {
    container = DOC.querySelector(container);
    if (!container) throw new Error("Invalid container");
  } else if (!container) {
    container = DOC.body;
  }

  let extras = {
    component: {},
    store: {},
    render: {},
  };

  if (use) {
    [].concat(use).forEach((m) => {
      let { store, component, render } = typeof m === FUNC ? m(options) : m;
      if (component) {
        addExtras(extras.component, "init", component, combine);
        addExtras(extras.component, "error", component, combine);
        addExtras(extras.component, "updating", component, combine);
        addExtras(extras.component, "mount", component, combine);
        addExtras(extras.component, "unmount", component, combine);
        addExtras(extras.component, "updated", component, combine);
      }
      if (store) {
        addExtras(extras.store, "create", store, compose);
      }
      if (render) {
        addExtras(extras.render, "object", render, compose);
      }
    });
  }
  let emitter = createEmitter();
  let store = extras.store.create
    ? extras.store.create(state)
    : createSimpleStore(state);
  let app = { store, extras, watch };
  let context = {};
  let data = {};
  let marker = createMarker("app");
  let watchToken;
  let hasParam = false;
  let result = {
    get state() {
      return store.getState();
    },
    ...store,
    update,
  };

  function update(state) {
    return data[INNER].forceUpdate(arguments.length ? state : store.getState());
  }

  function startWatching() {
    if (watchToken) return;
    let token = (watchToken = {});
    function tick() {
      enqueue2(() => {
        if (token !== watchToken) return;
        if (!emitter.has(WATCH)) {
          token = undefined;
          return;
        }
        emitter.emit(WATCH);
        tick();
      });
    }

    tick();
  }

  function watch(watcher) {
    startWatching();
    return emitter.on(WATCH, watcher);
  }

  function handleStateChange() {
    onChange && onChange(result);
    data[INNER].update(store.getState());
    onUpdate && onUpdate(result);
  }

  if (!extras.component.error) extras.component.error = defaultErrorBoundary;

  container.innerHTML = "";
  container.appendChild(marker);

  if (typeof content === FUNC) {
    hasParam = content.length;
  } else if (isArray(content) && typeof content[0] === FUNC) {
    hasParam = content[0].length;
  }

  if (hasParam) store.subscribe(handleStateChange);

  renderComponent(
    renderContent,
    app,
    context,
    data,
    INNER,
    marker,
    hasParam === false ? () => content : content,
    store.getState()
  );

  onLoad && onLoad(result);

  return result;
}

function addExtras(target, name, middleware, action) {
  if (!middleware[name]) return;
  target[name] = action(target[name], middleware[name]);
}

function compose(prev, next) {
  if (!prev) return (input) => next(input, NOOP);
  return (input) => next(input, prev);
}

function combine(prev, next) {
  // noinspection CommaExpressionJS
  return prev ? (input) => (prev(input), next(input)) : next;
}
