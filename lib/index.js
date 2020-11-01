const templateType = "@@template";
const htmlType = "@@html";
const loadableType = "@@loadable";
const loadablePromiseType = "@@loadablePromise";
const templateCache = {};
const bindingPrefix = "hta-";
const defaultKeySelector = (value, index) => index;
const defaultItemRenderer = (value) => ({ text: value });
const defaultItemMapper = (value) => value;
const hideClassName = "hta-hide";
const noop = () => {};
const indexOf = [].indexOf;
const updateAsync = true;
const stateHookType = 0;
const memoHookType = 2;
const callbackHookType = 3;

export default function hta() {
  if (Array.isArray(arguments[0])) return createTemplate.apply(null, arguments);
  let [
    component,
    {
      state = {},
      container = document.body,
      middleware,
      onChange,
      onUpdate,
      onLoad
    } = {}
  ] = arguments;
  if (typeof container === "string") {
    container = document.querySelector(container);
  }

  let store = createStore(state);

  if (middleware) {
    store = middleware(store);
  }

  store.subscribe(() => {
    typeof onChange === "function" && onChange({ type: "change", target: app });
    data.use.forceUpdateWithProps(store.getState());
    typeof onUpdate === "function" && onUpdate({ type: "update", target: app });
  });

  const context = {
    ...store
  };

  const data = {};
  const app = {
    ...store,
    get state() {
      return store.getState();
    }
  };

  bind(context, container, data, [component, store.getState()]);

  typeof onLoad === "function" && onLoad({ type: "load", target: app });

  return app;
}

function getElementPath(element) {
  const path = [];
  while (element.parentNode) {
    const index = indexOf.call(element.parentNode.childNodes, element);
    path.unshift(index);
    element = element.parentNode;
  }
  return path;
}

function createTemplate(strings) {
  const substitutions = [].slice.call(arguments, 1);
  const slotCount = substitutions.length;
  let query;
  const literals = {};
  let hasLiteral = false;
  let htmlArray = [strings[0]];
  for (let i = 0; i < slotCount; i++) {
    const subs = substitutions[i];
    if (Array.isArray(subs) && typeof subs[0] !== "function") {
      hasLiteral = true;
      literals[i] = subs[0];
      htmlArray.push(subs[0]);
    } else {
      htmlArray.push(` ${bindingPrefix}${i}="1" `);
    }
    htmlArray.push(strings[i + 1]);
  }
  const html = htmlArray.join("");

  const instance = {
    type: templateType,
    strings,
    substitutions,
    literals,
    hasLiteral,
    isEqual(template) {
      return (
        arrayEqual(template.strings, strings) &&
        template.hasLiteral === hasLiteral &&
        objectEqual(template.literals, literals)
      );
    },
    render(container) {
      if (!substitutions.length) {
        container.innerHTML = html;
        return { elements: [], bindings: [], literals: [] };
      }

      let cacheTemplate = templateCache[html];
      if (!cacheTemplate) {
        if (!query) {
          const q = [];
          for (let i = 0; i < substitutions.length; i++) {
            if (i in literals) continue;
            q.push(`[${bindingPrefix}${i}]`);
          }
          query = q.join(",");
        }
        const template = document.createElement("template");
        template.innerHTML = html;
        const elements = [...template.content.querySelectorAll(query)];
        const bindings = [];
        const paths = [];
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          paths[i] = getElementPath(element);
          const b = bindings[i] || (bindings[i] = []);
          for (let j = 0; j < slotCount; j++) {
            const id = bindingPrefix + j;
            if (element.getAttribute(id) === "1") b.push(j);
          }
        }

        templateCache[html] = cacheTemplate = function (container) {
          container.appendChild(template.content.cloneNode(true));
          return {
            elements: paths.map((path) =>
              path.reduce(
                (parentNode, index) => parentNode.childNodes[index],
                container
              )
            ),
            bindings
          };
        };
      }
      return cacheTemplate(container);
    }
  };

  return instance;
}

function isTemplate(value) {
  return value && value.type === templateType;
}

function bind(context, container, data, binding) {
  // convert component/component with props to property binding
  if (typeof binding === "function" || Array.isArray(binding)) {
    return applyBinding(context, container, data, {
      use: binding
    });
  }
  // template binding
  if (isTemplate(binding)) {
    return applyBinding(context, container, data, {
      html: binding
    });
  }
  // value binding
  if (!isPlainObject(binding)) {
    return applyBinding(context, container, data, {
      text: binding
    });
  }

  return applyBinding(context, container, data, binding);
}

function applyBinding(context, container, data, binding) {
  if (binding.once) {
    if (!container.$$binded) container.$$binded = new WeakSet();
    if (container.$$binded.has(binding)) return;
    container.$$binded.add(binding);

    if (binding.sheet) {
      for (const name in binding.sheet) {
        const sheet = binding.sheet[name];
        if (sheet) {
          const id = sheet.id || name;
          createStyleSheet(id, sheet.text);
        }
      }
    }
  }
  // validate binding
  if (binding.ref) {
    if (typeof binding.ref === "function") {
      binding.ref(container);
    } else {
      binding.ref.current = container;
    }
  }

  if ("loading" in binding) {
    const { loading, ...otherBinding } = binding;
    function handleLoading(promise) {
      bind(
        context,
        container,
        data,
        typeof loading === "function" ? loading() : loading
      );
      promise.finally(() => applyBinding(context, container, data, binding));
    }

    bind(
      Object.assign({}, context, { handleLoading }),
      container,
      data,
      otherBinding
    );
    return;
  }

  if ("init" in binding) {
    if (!data.dirty) {
      container.innerHTML =
        typeof binding.init === "function"
          ? binding.init(container)
          : binding.init;
    }
    if (process.env.NODE_ENV !== "production") {
      binding.init = noop;
    }
  }

  data.dirty = true;

  if ("each" in binding) {
    bindList(context, container, binding.each, binding.item);

    if (process.env.NODE_ENV !== "production") {
      binding.each = noop;
      binding.item = noop;
    }
  }

  if (binding.use) {
    let component, props;
    if (Array.isArray(binding.use)) {
      component = binding.use[0];
      props = binding.use[1];
    } else {
      component = binding.use;
    }

    if (!data.use || data.use.component !== component) {
      data.use = { component, renderData: {} };
    }
    mount(context, container, data.use, component, props);
    if (process.env.NODE_ENV !== "production") {
      binding.use = noop;
    }
  }

  let nodeData = container.$$data;
  if (!nodeData) container.$$data = nodeData = {};

  for (const type in binding) {
    const value = binding[type];
    switch (type[0]) {
      case "@":
        bindAttribute(context, container, nodeData, type.substr(1), value);
        break;
      case "$":
        if (type === "$bind") continue;
        bindEvent(context, container, nodeData, type.substr(1), value);
        break;
      case ".":
        bindProperty(context, container, nodeData, type.substr(1), value);
        break;
      default:
        switch (type) {
          case "id":
          case "for":
          case "href":
          case "title":
          case "size":
          case "lang":
          case "dir":
          case "tabindex":
          case "src":
          case "alt":
            bindAttribute(context, container, nodeData, type, value);
            break;
          case "checked":
          case "disabled":
          case "value":
          case "selected":
          case "multiple":
          case "scrollLeft":
          case "scrollTop":
          case "name":
            bindProperty(context, container, nodeData, type, value);
            break;
          case "class":
            bindClass(context, container, nodeData, type, value);
            break;
          case "style":
            bindStyle(context, container, nodeData, type, value);
            break;
          case "html":
            bindHtml(context, container, type, value);
            break;
          case "text":
            bindText(context, container, type, value);
            break;
          case "attr":
            for (const attr in value) {
              bindAttribute(context, container, nodeData, attr, value[attr]);
            }
            break;
          case "prop":
            for (const prop in value) {
              bindProperty(context, container, nodeData, prop, value[prop]);
            }
            break;
          case "on":
            for (const event in value) {
              if (event === "bind") continue;
              bindEvent(context, container, nodeData, event, value[event]);
            }
            break;
          case "visible":
            container.classList.toggle(hideClassName, !value);
            break;
          // special bindings
          case "once":
          case "ref":
          case "sheet":
            break;
          default:
            if (process.env.NODE_ENV !== "production") {
              if (value !== noop) {
                console.warn("Not supported binding " + type);
              }
            }
        }
    }
  }
}

function getChildTagName(containerTagName) {
  switch (containerTagName) {
    case "UL":
    case "OL":
      return "LI";
    case "SELECT":
    case "OPTGROUP":
      return "OPTION";
    case "DL":
      return "DT";
    case "TABLE":
    case "THEAD":
    case "TBODY":
      return "TR";
    case "TR":
      return "TD";
    case "NAV":
      return "A";
    case "MENU":
      return "MENUITEM";
    default:
      return "DIV";
  }
}

function initListData(context, container, data) {
  data.children = [];
  data.keyToIndex = {};
  data.template = document.createElement("template");

  if (data.item.tag === "#child") {
    const firstElementChild = container.firstElementChild;
    if (!firstElementChild)
      throw new Error("No element found in list container");
    container.removeChild(firstElementChild);
    data.createNode = function () {
      return firstElementChild.cloneNode(true);
    };
  } else {
    if (container instanceof SVGElement) {
      data.createNode = function () {
        return document.createElementNS(container.namespaceURI, data.item.tag);
      };
    } else {
      data.createNode = function () {
        return document.createElement(data.item.tag);
      };
    }
  }

  const removeOnDestroy = addListener(container, "destroy", unmount);

  function unmount() {
    removeOnDestroy();
    data.clear();
  }

  data.unmount = unmount;
  data.clear = function () {
    if (container instanceof SVGElement) {
      while (container.lastChild) container.removeChild(container.lastChild);
    } else {
      let i = data.children.length;
      while (i--) {
        fireEvent(
          data.children[i].node,
          "destroy",
          undefined,
          context.dispatch
        );
      }
      data.children = [];
      data.keyToIndex = {};
      container.textContent = "";
    }
  };
  data.appendAll = function (createNode, list) {
    // append all
    let last = null;
    data.children = [];
    data.keyToIndex = {};
    for (let i = list.length - 1; i >= 0; i--) {
      const key = data.item.key(list[i], i);
      const item = data.item.map(list[i], i);
      const node = createNode(item, i);
      const child = { key, node, item };
      data.keyToIndex[key] = i;
      data.children[i] = child;
      data.template.content.insertBefore(node, last);

      bind(context, node, child, data.item.render(item, i));

      last = node;
    }
    container.appendChild(data.template.content);
  };
}

function bindList(context, container, list, itemOptions) {
  let data;
  if (!container.$$content || container.$$content.type !== "list") {
    unmountContent(container, context);
    data = container.$$content = { type: "list" };
  } else {
    data = container.$$content;
  }

  if (!itemOptions || typeof itemOptions === "function") {
    data.item = {
      tag: getChildTagName(container.tagName),
      pure: false,
      key: defaultKeySelector,
      render: itemOptions || defaultItemRenderer,
      map: defaultItemMapper
    };
  } else {
    data.item = {
      tag: itemOptions.tag || getChildTagName(container.tagName),
      pure: itemOptions.pure,
      render: itemOptions.render || defaultItemRenderer,
      key: itemOptions.key || defaultKeySelector,
      map: itemOptions.map || defaultItemMapper
    };
  }

  if (!list) list = [];

  if (!data.initialized) {
    data.initialized = true;
    initListData(context, container, data);
  }
  const createNode =
    typeof data.item.tag === "function" ? data.item.tag : data.createNode;

  if (data.children.length && !list.length) {
    data.clear();
  } else if (!data.children.length && list.length) {
    data.clear();
    data.appendAll(createNode, list);
  } else {
    // update
    const children = [];
    const keyToIndex = {};
    const bindings = [];
    const mappedItems = [];
    let newCount = 0;
    for (let i = 0; i < list.length; i++) {
      const key = data.item.key(list[i], i);
      const item = data.item.map(list[i], i);
      const prevChild = data.children[data.keyToIndex[key]];
      mappedItems[i] = item;
      if (!prevChild) {
        newCount++;
        children[i] = { key, item };
      } else {
        children[i] = Object.assign({}, prevChild);
      }
      keyToIndex[key] = i;
      data.keyToIndex[key] = undefined;
    }
    if (newCount === list.length) {
      data.clear();
      data.appendAll(createNode, list);
    } else {
      if (list.length !== data.children.length || newCount) {
        for (let i = data.children.length - 1; i >= 0; i--) {
          const prevChild = data.children[i];
          if (typeof data.keyToIndex[prevChild.key] !== "undefined") {
            fireEvent(prevChild.node, "destroy", undefined, context.dispatch);
            data.children.splice(i, 1);
            container.removeChild(prevChild.node);
          }
        }
      }

      let lastNode = null;
      for (let i = list.length - 1; i >= 0; i--) {
        const nextChild = children[i];
        const prevChild = data.children[i];
        const item = mappedItems[i];
        let shouldUpdate = false;
        if (!nextChild.node) {
          shouldUpdate = true;
          nextChild.node = createNode(item, i);
        } else {
          shouldUpdate = !(data.item.pure && nextChild.item === item);
        }
        if (!prevChild || nextChild.key !== prevChild.key) {
          container.insertBefore(nextChild.node, lastNode);
        }
        if (shouldUpdate) {
          nextChild.item = item;
          bindings[bindings.length] = [
            context,
            nextChild.node,
            nextChild,
            data.item.render(item, i)
          ];
        }

        lastNode = nextChild.node;
      }

      data.children = children;
      data.keyToIndex = keyToIndex;
      const token = (data.updateToken = {});
      if (bindings.length) {
        if (updateAsync) {
          Promise.resolve().then(
            () => token === data.updateToken && bindMultiple(bindings)
          );
        } else {
          bindMultiple(bindings);
        }
      }
    }
  }
}

function bindMultiple(bindings) {
  for (let i = 0; i < bindings.length; i++) {
    bind.apply(null, bindings[i]);
  }
}

function createStore(initial) {
  if (
    (initial && typeof initial.dispatch === "function") ||
    typeof initial.getState === "function"
  ) {
    return initial;
  }

  const eventSource = {};
  let originalState;
  let dispatchingScopes = 0;
  let pendingChanges;
  let updateTimer;
  let state = {};

  function lazyUpdateState(changes) {
    clearTimeout(updateTimer);
    pendingChanges = { ...pendingChanges, ...changes };
    updateTimer = setTimeout(updateState, 0, pendingChanges);
  }

  function updateState(changes) {
    if (!changes) return;
    let next = state;
    for (const prop in changes) {
      const value = changes[prop];
      // noinspection JSUnfilteredForInLoop
      if (next[prop] !== value) {
        if (next === state) {
          next = Object.assign({}, state);
        }
        if (isPromiseLike(value)) {
          const promise = value;
          next[prop] = loadable(promise, {
            last: next[prop],
            onDone(loadable) {
              state[prop] === promise && lazyUpdateState({ [prop]: loadable });
            }
          });
        } else if (value && typeof value.next === "function") {
          // generator
        } else {
          next[prop] = value;
        }
      }
    }
    if (next !== state) {
      state = next;
    }
  }

  function dispatch(action, payload) {
    try {
      if (!dispatchingScopes) {
        originalState = state;
      }
      dispatchingScopes++;
      if (Array.isArray(action)) {
        if (action.length > 1) {
          if (typeof action[1] === "function") {
            payload = action[1](payload);
          } else {
            payload = action[1];
          }
        }
        action = action[0];
      }

      if (typeof action !== "function") return action;

      // support async payload
      if (isPromiseLike(payload)) {
        return payload.then((resolved) => dispatch(action, resolved));
      }

      const result = action(state, payload);

      if (!result) return result;

      // for async action, we support only action dispatching, no state updating
      // async function Action() {
      //    return [action, payload]
      //    return action
      // }
      if (isPromiseLike(result)) {
        return result.then(dispatch, dispatch);
      }

      if (typeof result === "function") return dispatch(result);

      if (Array.isArray(result)) {
        // update state and dispatch action later on
        // [changes, action, payload?]
        if (typeof result[0] !== "function") {
          updateState(result[0]);
          return dispatch(...result.slice(1));
        }

        return dispatch(...result);
      }

      if (result && typeof result === "object") {
        updateState(result);
      }
    } finally {
      dispatchingScopes--;
      if (!dispatchingScopes && originalState !== state) {
        fireEvent(eventSource, "change", state);
      }
    }
  }

  if (initial) {
    updateState(initial);
  }

  return {
    // define API that compatibles with redux store
    getState() {
      return state;
    },
    subscribe(listener) {
      return addListener(eventSource, "change", listener);
    },
    dispatch
  };
}

function bindClass(context, container, data, type, value) {
  if (typeof value === "object") {
    data.class = undefined;
    for (const token in value) {
      // noinspection JSUnfilteredForInLoop
      container.classList.toggle(token, !!value[token]);
    }
  } else {
    if (data.class === value) return;
    data.class = value;
    container.className = getNodeInitialData(container).class + value;
  }
}

function bindStyle(context, container, data, type, value) {
  if (typeof value === "object") {
    data.style = undefined;
    for (const prop in value) {
      // noinspection JSUnfilteredForInLoop
      if (prop[0] === "-") {
        container.style.setProperty(prop, value[prop]);
      } else {
        container.style[prop] = value[prop];
      }
    }
  } else {
    if (data.style === value) return;
    data.style = value;
    container.style = getNodeInitialData(container).style + value;
  }
}

function bindEvent(context, container, model, event, action) {
  if (event === "bind") return;

  const key = "e:" + event;
  const prevHandler = model[key];
  if (
    prevHandler === action ||
    (prevHandler &&
      (prevHandler.action === action ||
        (Array.isArray(action) && arrayEqual(action, prevHandler.action))))
  ) {
    return;
  }
  let debounceMs, debounceTimer;
  if (isPlainObject(action)) {
    debounceMs = action.debounce;
    if ("payload" in action) {
      action = [action.action, action.payload];
    } else {
      action = action.action;
    }
  }
  const handler = (e) => {
    if (debounceMs) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => context.dispatch(action, e), debounceMs);
      return;
    }
    return context.dispatch(action, e);
  };
  model[key] = handler;
  handler.action = action;
  if (event === "destroy") return addListener(container, "destroy", handler);
  // custom event
  if (event[0] === "$") {
    if (prevHandler) {
      container.removeEventListener(event.substr(1), prevHandler);
    }
    container.addEventListener(event.substr(1), handler);
  } else {
    container["on" + event] = handler;
  }
}

function addListener(target, event, listener) {
  const key = "$$" + event;
  let active = true;
  let listeners = target[key];
  if (!listeners) {
    target[key] = listeners = [];
    listeners.firing = 0;
  }
  listeners.push(listener);
  return function () {
    if (!active) return;
    active = false;
    if (listeners.pendingRemove) {
      listeners.pendingRemove.add(listener);
    } else {
      listeners.splice(listeners.indexOf(listener), 1);
    }
  };
}

function fireEvent(target, event, payload, dispatcher) {
  const key = "$$" + event;
  const listeners = target[key];
  if (!listeners) return;
  if (!listeners.pendingRemove) listeners.pendingRemove = new Set();
  listeners.firing++;
  try {
    // skip new listeners
    const length = listeners.length;

    if (dispatcher) {
      for (let i = 0; i < length; i++) {
        dispatcher(listeners[i], payload);
      }
    } else {
      for (let i = 0; i < length; i++) {
        listeners[i](payload);
      }
    }
  } finally {
    listeners.firing--;
    if (!listeners.firing) {
      listeners.pendingRemove.forEach((listener) => {
        listeners.splice(listeners.indexOf(listener), 1);
      });
      listeners.pendingRemove.clear();
    }
  }
}

function bindProperty(context, container, data, prop, value) {
  const key = "p:" + prop;
  if (data[key] === value) return;
  data[key] = value;
  container[prop] = value;
}

function getNodeInitialData(node) {
  if (!node.$$initial) {
    node.$$initial = {
      style: (node.getAttribute("style") || "") + ";",
      class: (node.getAttribute("class") || "") + " "
    };
  }
  return node.$$initial;
}

function bindAttribute(context, container, data, attr, value) {
  const key = "a:" + attr;
  if (data[key] === value) return;
  data[key] = value;
  container.setAttribute(attr, value);
}

function unmountContent(container, context) {
  const content = container.$$content;
  if (!content) return;
  if (content.type === "list") {
    content.unmount();
  } else if (content.type === "template") {
    const elements = content.elements;
    for (let i = 0; i < elements.length; i++) {
      fireEvent(elements[i], "destroy", undefined, context.dispatch);
    }
  }
}

function bindText(context, container, type, value) {
  let data;
  if (!container.$$content || container.$$content.type !== "text") {
    unmountContent(container, context);
    data = container.$$content = { type: "text" };
  } else {
    data = container.$$content;
  }

  if (data.text !== value) {
    data.text = value;
    const text =
      typeof value === "undefined" ||
      value === null ||
      typeof value === "boolean"
        ? ""
        : value;
    if (
      container.childNodes.length === 1 &&
      container.firstChild.nodeType === Node.TEXT_NODE
    ) {
      container.firstChild.nodeValue = text;
    } else {
      container.textContent = text;
    }
  }
}

function bindHtml(context, container, type, value) {
  let data = container.$$content;

  if (isTemplate(value)) {
    if (!data || data.type !== "template" || !data.value.isEqual(value)) {
      unmountContent(container, context);
      container.innerHTML = "";
      container.$$content = data = {
        type: "template",
        value,
        data: [],
        ...value.render(container)
      };
    }

    const elements = data.elements;
    const bindings = data.bindings;
    for (let i = 0; i < elements.length; i++) {
      const bindingIndexes = bindings[i];
      const element = elements[i];
      let elementData = data.data[i];
      if (!elementData) {
        data.data[i] = elementData = {};
      }
      for (let j = 0; j < bindingIndexes.length; j++) {
        bind(
          context,
          element,
          elementData,
          value.substitutions[bindingIndexes[j]]
        );
      }
    }
  } else {
    if (!container.$$content || container.$$content.type !== "html") {
      unmountContent(container, context);
      data = container.$$content = { type: "html" };
    } else {
      data = container.$$content;
    }
    if (!data || data.type !== htmlType || data.value !== value) {
      container.$$content = { type: htmlType, value };
    }
    container.innerHTML = value;
  }
}

function mount(context, container, data, component, props = {}) {
  if (!data.initialized) {
    data.initialized = true;
    data.selectors = [];
    data.prevValues = [];
    data.binded = false;
    data.hooks = createHookCollection();

    data.handleStateChange = function () {
      data.error = undefined;
      try {
        if (
          data.selectors.length &&
          data.selectors.every((selector, index) =>
            isEqual(
              selector(context.getState(), valueOf),
              data.prevValues[index]
            )
          )
        )
          return;
      } catch (e) {
        if (isPromiseLike(e) && context.handleLoading) {
          return context.handleLoading(e);
        }
        data.error = e;
      }
      data.forceUpdate();
    };
    data.forceUpdateWithProps = function (props) {
      data.props = props;
      data.forceUpdate();
    };
    data.forceUpdate = function () {
      if (data.error) throw data.error;
      data.selectors = [];
      data.prevValues = [];
      data.hooks.reset();

      try {
        const content = component(data.props, data.utils);
        bind(context, container, data, content);

        if (!data.binded) {
          data.binded = true;
          if (content && (content.$mount || (content.on && content.on.mount))) {
            const onMount = content.$mount || content.on.mount;
            context.dispatch(onMount, {
              type: "mount",
              target: container,
              component
            });
          }
        }
      } catch (e) {
        if (isPromiseLike(e) && context.handleLoading) {
          context.handleLoading(e);
        } else {
          throw e;
        }
      }
    };
    data.update = function (props) {
      if (data.props && objectEqual(data.props, props)) return;
      data.props = props;
      data.forceUpdate();
    };

    data.utils = function (selector) {
      if (typeof selector === "function") return data.utils.useStore(selector);
      return data.utils.useState(selector);
    };
    Object.assign(data.utils, {
      useStore(selector) {
        if (!data.unsubscribe) {
          data.unsubscribe = context.subscribe(data.handleStateChange);
        }
        const value = selector(context.getState(), valueOf);
        data.selectors.push(selector);
        data.prevValues.push(value);
        return value;
      },
      useState(initial) {
        return data.hooks.get(stateHookType, () => {
          let value = initial;

          function set(nextValue) {
            if (typeof nextValue === "function") {
              nextValue = nextValue(value);
            }
            if (nextValue === value) return;
            value = nextValue;
            data.forceUpdate();
          }

          return function () {
            return [value, set];
          };
        });
      },
      useMemo(factory, deps = []) {
        return data.hooks.get(
          memoHookType,
          () => {
            const value = factory();
            return () => value;
          },
          deps
        );
      },
      useCallback(callback, deps) {
        return data.hooks.get(callbackHookType, () => () => callback, deps);
      }
    });
  }
  data.update(props);
}

function isPromiseLike(obj) {
  return obj && typeof obj.then === "function";
}

function arrayEqual(a, b, comparer) {
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    if (comparer) {
      return a.every((value, index) => comparer(value, b[index]));
    }
    return a.every((value, index) => value === b[index]);
  }
  return false;
}

function objectEqual(a, b) {
  for (const ka in a) {
    if (a[ka] !== b[ka]) return false;
  }
  for (const kb in b) {
    if (a[kb] !== b[kb]) return false;
  }
  return true;
}

/*!
 * Check if an item is a plain object or not
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Object}  obj  The item to check
 * @return {Boolean}      Returns true if the item is a plain object
 */
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function createHookCollection() {
  let index = -1;
  let currentCount = 0;
  let prevCount = undefined;
  const hooks = [];

  return {
    reset() {
      if (prevCount !== undefined && currentCount !== prevCount) {
        throw new Error(
          `Invalid hook usages. Previous: ${prevCount}, Current: ${currentCount}`
        );
      }
      prevCount = currentCount;
      index = -1;
    },
    get(type, initial, deps = []) {
      index++;
      let hook = hooks[index];
      if (hook) {
        if (hook.type !== type) {
          throw new Error("Invalid hook order");
        }
        // re-create hook if deps changed
        if (
          deps.length !== hook.deps.length ||
          hook.deps.some((dep, index) => dep !== deps[index])
        ) {
          hook = undefined;
        }
      }
      if (!hook) {
        hooks[index] = hook = { type, deps };
        hook.result = initial();
      }
      return hook.result();
    }
  };
}

function createStyleSheet(id, text) {
  if (document.getElementById(id)) return;
  const styleElement = document.createElement("style");
  styleElement.id = id;
  styleElement.type = "text/css";

  const styleContainer = document.querySelector("head") || document.body;

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = text;
  } else {
    styleElement.appendChild(document.createTextNode(text));
  }
  styleContainer.appendChild(styleElement);
}

function init() {
  createStyleSheet(
    "hta-styles",
    `.${hideClassName} {display: none !important;}`
  );
}

export function loadable(promise, options = {}) {
  const props = {
    status: "loaded",
    value: !isPromiseLike(promise) ? promise : undefined,
    ...options
  };

  if (isPromiseLike(promise)) {
    props.status = "loading";
    props.promise = new Promise((resolve, reject) => {
      promise.then(
        (value) => {
          if (props.status === "cancelled") return;
          props.status = "loaded";
          props.value = value;
          resolve(value);
          typeof props.onDone === "function" &&
          props.onDone(
            loadable(undefined, {
              status: "loaded",
              value
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
            loadable(undefined, {
              status: "failed",
              error
            })
          );
        }
      );
    });
    props.promise.type = loadablePromiseType;
  }

  return {
    type: loadableType,
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
          if (props.last.type === loadableType) {
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
        return loadable(selector(props.value));
      }
      if (props.status === "failed") {
        return loadable(undefined, { status: "failed", error: props.error });
      }
      return loadable(props.promise.then(selector));
    }
  };
}

function isEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    isPromiseLike(a) ||
    isPromiseLike(b) ||
    Array.isArray(a) ||
    Array.isArray(b)
  )
    return false;
  if (a === null && b) return false;
  if (b === null && a) return false;

  return objectEqual(a, b);
}

export function valueOf(loadable) {
  if (Array.isArray(loadable)) {
    return loadable.map((item) => {
      if (item && item.type === loadableType) {
        return item.value;
      }
      return item;
    });
  }
  if (loadable && loadable.type === loadableType) {
    return loadable.value;
  }
  return loadable;
}

init();
