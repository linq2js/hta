import createInstance from "./createInstance";
import createMarker from "./createMarker";
import isEqual from "./isEqual";
import objectEqual from "./objectEqual";
import tryReorder from "./tryReorder";
import tryUnmount from "./tryUnmount";
import { EMPTY_OBJECT, FUNC, INNER, RENDERER, SCOPE } from "./types";
import { enqueue1, isArray, margeState } from "./util";

export default function renderComponent(
  renderContent,
  app,
  context,
  parent,
  key,
  marker,
  component,
  props,
  children
) {
  if (!props) props = EMPTY_OBJECT;
  if (children) props = { children, ...props };
  if (component.type === RENDERER) {
    return component(app, context, parent, key, marker, props, renderContent);
  }

  let instance = createInstance(parent, key, component, null, mount, [
    renderContent,
    app,
    context,
    marker,
    component,
  ]);
  instance.update(props);
}

function mount(renderContent, app, context, marker, component) {
  let innerMaker = createMarker();
  let prevProps;
  let data = {};
  let firstRender = true;
  let extras = app.extras.component;
  let updateAsyncToken;
  let storeValues = [];
  let unmounted = false;
  let currentState;
  let error;
  let subscriptions = new Map();
  let rendered = false;
  let instance = {
    firstNode() {
      return data[INNER].firstNode();
    },
    forceUpdate,
    forceUpdateAsync,
    update,
    unmount,
    select,
    reorder,
    subscribe,
  };
  let state = {};
  let api = {
    select,
    dispatch: app.store.dispatch,
    getState,
    setState,
  };

  function getState(initializer) {
    if (!rendered && arguments.length) {
      state =
        (typeof initializer === "function" ? initializer() : initializer) ||
        state;
    }
    return state;
  }

  function setState(changes, callback) {
    let next = margeState(state, changes);
    if (next !== state) {
      state = next;
      forceUpdate();
      callback && callback(state);
    }
  }

  function subscribe(subscribeFn, handler) {
    if (subscriptions.has(subscribeFn)) return;
    subscriptions.set(subscribeFn, subscribeFn(handler));
  }

  function invoke(handler, args) {
    handler &&
      handler({ ...args, app, context, instance, component, props: prevProps });
  }

  function update(props) {
    if (prevProps && objectEqual(prevProps, props)) return;
    forceUpdate(props);
  }

  function reorder() {
    marker.before(innerMaker);
    tryReorder(data[INNER]);
  }

  function forceUpdate() {
    arguments.length && (prevProps = arguments[0]);
    let prevScope = SCOPE.current;
    SCOPE.current = { app, context, component: instance, props: prevProps };
    currentState = null;
    error && invoke(extras.error, { error });
    storeValues = [];
    invoke(extras.updating);
    try {
      let content = component(prevProps, api);
      rendered = true;
      renderContent(app, context, data, INNER, innerMaker, content);
    } catch (error) {
      invoke(extras.error, { error });
    } finally {
      SCOPE.current = prevScope;
      if (firstRender) {
        firstRender = false;
        invoke(extras.mount);
      }
      invoke(extras.updated);
    }
  }

  function handleStateChange() {
    if (unmounted) return;
    error = undefined;
    try {
      let state = app.store.getState();
      if (storeValues.every((x) => isEqual(x.selector(state), x.value))) return;
    } catch (e) {
      error = e;
    }
    forceUpdate();
  }

  function select(selector) {
    if (typeof selector !== FUNC) {
      if (isArray(selector)) return selector.map(select);
      return select((state) => state[selector]);
    }
    if (!currentState) currentState = app.store.getState();
    let value = selector(currentState);
    storeValues[storeValues.length] = { selector, value };
    subscribe(app.store.subscribe, handleStateChange);
    return value;
  }

  function forceUpdateAsync() {
    let token = (updateAsyncToken = {});
    enqueue1(() => {
      token === updateAsyncToken && forceUpdate();
    });
  }

  function unmount() {
    if (unmounted) return;
    unmounted = true;
    for (let unsubscribe of subscriptions.values()) {
      unsubscribe && unsubscribe();
    }
    // if an error occurs during rendering phase, no INNER rendered
    tryUnmount(data[INNER]);
    innerMaker.remove();
    invoke(extras.unmount);
  }

  marker.before(innerMaker);

  invoke(extras.init);

  return instance;
}
