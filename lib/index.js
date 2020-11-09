// using let declaration for smaller bundle size
export let emptyArray = [];
export let emptyObject = {};
export let renderingContext = {};
const cachedMethodInvokings = {};
let slice = emptyArray.slice;
let indexOf = emptyArray.indexOf;
let noop = () => {};
let templateCache = {};
let htmlCache = [];
let templateType = () => {};
let customRendererType = () => {};
let placeholderType = () => {};
let directiveType = () => {};
let textType = () => {};
let listType = () => {};
let loadablePromiseType = () => {};
let loadableType = () => {};
let suspenseType = () => {};
let dynamicBindingType = () => {};
let rawHtmlType = () => {};
let selectorType = () => {};
let doc = document;
let debugMode = false;
let activeSheets = {};
let hideClassName = "hta-hide";
let stateHookType = 0;
let memoHookType = 1;
let callbackHookType = 2;
let effectHookType = 3;
let refHookType = 4;
let bindHookType = 5;
let checkTagNamePattern = /^[a-z0-9_-]+/i;
let defaultProviderName = "@@default";
let providerType = () => {};
let isArray = Array.isArray;

export let enqueue1 = Promise.resolve().then.bind(Promise.resolve());
export let enqueue2 =
  typeof requestAnimationFrame === "undefined"
    ? enqueue1
    : requestAnimationFrame;

export default function hta(strings) {
  let values = slice.call(arguments, 1);
  return createTemplate(undefined, strings, values);
}

function getCachedHtml(key) {
  let i = htmlCache.length;
  while (i--) if (arrayEqual(htmlCache[i].key, key)) return htmlCache[i].value;
}

function createTemplate(key, strings, values) {
  let parsedHtml = getCachedHtml(strings);
  return {
    type: templateType,
    key,
    strings,
    values,
    render(marker, newTemplate, renderResult) {
      let ns = marker.parentNode && marker.parentNode.namespaceURI;

      if (!parsedHtml) {
        parsedHtml = parseTemplate(strings);
        htmlCache[htmlCache.length] = { key: strings, value: parsedHtml };
      }
      let cachedTemplate = templateCache[parsedHtml.html];
      if (!cachedTemplate) {
        cachedTemplate = ns
          ? doc.createElementNS(ns, "template")
          : doc.createElement("template");
        cachedTemplate.innerHTML = parsedHtml.html;
        cachedTemplate.$$slots = !parsedHtml.query
          ? emptyArray
          : [
              ...(cachedTemplate.content || cachedTemplate).querySelectorAll(
                parsedHtml.query
              ),
            ].map((node, index) => {
              let result = {
                path: getElementPath(node),
                bindings: parsedHtml.slots
                  .map((type, index) => ({ index, type }))
                  .filter(
                    (slot) => node.getAttribute(`hta-${slot.index}`) === "1"
                  ),
              };
              if (node.getAttribute("hta-slot") === "1") {
                let marker = createMarker("placeholder " + index);
                node.before(marker);
                node.remove();
              }
              return result;
            });
        templateCache[parsedHtml.html] = cachedTemplate;
      }

      if (renderResult) {
        // update binding
        let i = renderResult.slots.length;
        while (i--) {
          let slot = renderResult.slots[i];
          let j = slot.bindings.length;
          while (j--) {
            let binding = slot.bindings[j];
            binding.value = newTemplate.values[binding.index];
          }
        }
      } else {
        let nodes = [];
        let templateNodes = (cachedTemplate.content || cachedTemplate)
          .childNodes;
        let i = templateNodes.length;
        while (i--) {
          nodes[i] = templateNodes[i].cloneNode(true);
          marker.parentNode.insertBefore(nodes[i], marker.nextSibling);
        }
        let parentNode = { childNodes: nodes };
        renderResult = {
          nodes,
          slots: cachedTemplate.$$slots.map((slot) => ({
            node: slot.path.reduce((p, i) => p.childNodes[i], parentNode),
            bindings: slot.bindings.map((b) => ({
              type: b.type,
              index: b.index,
              value: values[b.index],
            })),
          })),
        };
      }

      return renderResult;
    },
  };
}

export function parseTemplate(strings) {
  let slots = [];
  let html = [];
  let query = [];
  // unknown = 0, openTag = 1, singleQuote = 2, doubleQuote = 3
  let current = 0;

  function push(str) {
    if (!str) return;
    let i;
    if (!current) {
      // find open tag char
      i = str.indexOf("<");
      if (i === -1) {
        html.push(str);
        return;
      }
      html.push(str.substr(0, i + 1));
      str = str.substr(i + 1);
      let isClose = false;
      // is close tag
      if (str[0] === "/") {
        html.push("/");
        isClose = true;
        str = str.substr(1);
      }

      let result = checkTagNamePattern.exec(str);

      if (!result || (isClose && str[result[0].length] !== ">")) {
        throw new Error(`HTML is not well formed`);
      }
      current = isClose ? 0 : 1;
      html.push(result[0]);
      if (isClose) html.push(">");
      return push(str.substr(result[0].length + (isClose ? 1 : 0)));
    }
    if (current === 1) {
      let result = /['">]/.exec(str);
      // not found
      if (!result) {
        html.push(str);
        return;
      }
      if (result[0] === '"') {
        current = 3;
      } else if (result[0] === "'") {
        current = 2;
      } else {
        current = 0;
      }
      html.push(str.substr(0, result.index + 1));
      return push(str.substr(result.index + 1));
    }
    let result = str.indexOf(current === 2 ? "'" : '"');
    if (result === -1) {
      html.push(str);
      return;
    }
    current = 1;
    html.push(str.substr(0, result + 1));
    return push(str.substr(result + 1));
  }
  push(strings[0]);

  let length = strings.length - 1;
  for (let i = 0; i < length; i++) {
    if (current > 1)
      throw new Error("Cannot emebed binding inside attribute values. ");
    slots[i] = current === 1 ? directiveType : placeholderType;
    let attr = `hta-${i}`;
    html.push(
      current === 1
        ? ` ${attr}="1" `
        : `<template hta-slot="1" ${attr}="1"></template>`
    );
    query[i] = `[${attr}="1"]`;
    push(strings[i + 1]);
  }

  return { html: html.join(""), slots, query: query.join(",") };
}

export function getRenderingComponent() {
  return renderingContext.current.component;
}

export function getCurrentContext() {
  return renderingContext.current.context;
}

export function createCustomRenderer(renderer) {
  renderer.type = customRendererType;
  return renderer;
}

export function arrayEqual(a, b, comparer) {
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    let i = a.length;
    if (comparer) {
      while (i--) if (!comparer(a[i], b[i])) return false;
    } else {
      while (i--) if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return false;
}

export function isEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    isPromiseLike(a) ||
    isPromiseLike(b) ||
    isArray(a) ||
    isArray(b)
  )
    return false;
  if (a === null && b) return false;
  if (b === null && a) return false;

  return objectEqual(a, b);
}

export function objectEqual(a, b) {
  for (let ka in a) {
    if (a[ka] !== b[ka]) return false;
  }
  for (let kb in b) {
    if (a[kb] !== b[kb]) return false;
  }
  return true;
}

function getElementPath(element) {
  let path = [];
  while (element.parentNode) {
    let index = indexOf.call(element.parentNode.childNodes, element);
    path.unshift(index);
    element = element.parentNode;
  }
  return path;
}

function getHook() {
  return getRenderingComponent().hooks.get(...arguments);
}

function getContent(marker, type, creator) {
  let content = marker.$$content;
  if (content && content.type !== type) {
    tryUnmount(marker, true);
    content = undefined;
  }
  if (!content) {
    marker.$$content = content = { type };
    Object.assign(content, creator(content));
    content.marker && marker.before(content.marker);
  }
  return content;
}

function delay(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function consume(providerName = defaultProviderName) {
  return renderingContext.current.shared[providerName];
}

function lazy(fn, fallback) {
  let hasFallback = arguments.length > 1;
  let promise;
  let resolved;
  return function (props) {
    let [, setDone] = useState(false);
    if (!promise)
      promise = fn().then((result) => {
        resolved = {
          component:
            result && typeof result.default === "function"
              ? result.default
              : typeof result === "function"
              ? result
              : undefined,
        };
        hasFallback && setDone(true);
      });
    if (!resolved) {
      if (hasFallback) return fallback;
      throw promise;
    }
    return [resolved.component, props];
  };
}

function provide() {
  let [providerName, value, inputContent] =
    arguments.length > 2
      ? arguments
      : [defaultProviderName, arguments[0], arguments[1]];
  return createCustomRenderer((context, shared, marker) => {
    let content = getContent(marker, providerType, (content) => ({
      marker: createMarker("share"),
      unmount: () => tryUnmount(content.marker),
    }));

    renderContent(
      context,
      { ...shared, [providerName]: value },
      content.marker,
      inputContent
    );
  });
}

function createKeyedTemplate(key) {
  return function () {
    let template = hta.apply(null, arguments);
    template.key = key;
    return template;
  };
}

function createBinding(initial, updateNode) {
  function factory() {
    let value = initial;
    let api = {
      type: dynamicBindingType,
      watch(node, prop) {
        if (!removeListener) context.watch(watcher);
        if (updateNode && typeof node !== "function") node[prop] = value;
        watches.push({ node, prop });
      },
      get value() {
        return value;
      },
      set value(nextValue) {
        if (nextValue === value) return;
        value = nextValue;
        let i = watches.length;
        while (i--) watches[i].node[watches[i].prop] = value;
        component.forceUpdate();
      },
    };
    let watches = [];
    let { context, component } = renderingContext.current;
    let removeListener;

    function watcher() {
      let i = watches.length;
      let prev = value;
      while (i--)
        typeof watches[i].node === "function"
          ? watches[i].node(value)
          : (value = watches[i].node[watches[i].prop]);
      if (prev !== value) component.forceUpdateAsync();
    }

    return {
      dispose() {
        removeListener && removeListener();
      },
      result: () => api,
    };
  }
  return getHook(bindHookType, factory, []);
}

function suspense(fallback, input) {
  return createCustomRenderer((context, shared, marker) => {
    let content = getContent(marker, suspenseType, (content) => ({
      marker: createMarker("suspense"),
      shared: {
        ...shared,
        handleLoading(promise) {
          renderContent(context, shared, content.marker, content.fallback);
          let fallback = content.fallback;
          let input = content.input;
          promise.finally(() => {
            if (fallback !== content.fallback || input !== content.input)
              return;
            content.rerender();
          });
          return true;
        },
      },
      unmount() {
        tryUnmount(context.marker);
      },
      rerender() {
        if (content.unmounted) return;
        renderContent(context, content.shared, content.marker, content.input);
      },
    }));
    content.input = input;
    content.fallback = fallback;
    content.rerender();
  });
}

function createRef(initial) {
  return getRenderingComponent().hooks.ref(initial);
}

function useStore() {
  return getRenderingComponent().store.apply(null, arguments);
}

function useEffect(effect, deps = emptyArray) {
  function factory() {
    let dispose;
    let removeListener = addListener(getRenderingComponent(), "update", () => {
      removeListener();
      dispose = effect(getCurrentContext());
    });
    return {
      dispose: () => typeof dispose === "function" && dispose(),
      result: noop,
    };
  }
  return getHook(effectHookType, factory, deps);
}

function useState(initial) {
  function factory() {
    let value = initial;
    let component = getRenderingComponent();

    function set(nextValue) {
      if (typeof nextValue === "function") {
        nextValue = nextValue(value);
      }
      if (nextValue === value) return;
      value = nextValue;
      component.forceUpdateAsync();
    }

    return {
      result() {
        return [value, set];
      },
    };
  }
  return getHook(stateHookType, factory, emptyArray);
}

function useMemo(factory, deps = emptyArray) {
  return getHook(
    memoHookType,
    () => {
      let value = factory();
      return {
        result() {
          return value;
        },
      };
    },
    deps
  );
}

function useCallback(callback, deps) {
  return getHook(callbackHookType, () => ({ result: () => callback }), deps);
}

function debounce(ms, fn) {
  let prev;
  return function () {
    prev = executeDebounce(() => fn.apply(null, arguments), ms, prev);
  };
}

function useAction(action, payload) {
  let store = useStore();
  return useMemo(() => store.dispatch(action, payload), [action, payload]);
}

function shallowCache(previous, current) {
  if (!previous) return current;
  if (Array.isArray(previous))
    return arrayEqual(previous, current) ? previous : current;
  return isEqual(previous, current) ? previous : current;
}

function rawHtml(html) {
  return createCustomRenderer(function (context, shared, marker) {
    getContent(marker, rawHtmlType, (content) => {
      content.html !== html && content.unmount && content.unmount();
      const ns = marker.parentNode.namespaceURI;
      const template = ns
        ? doc.createElementNS(ns, "template")
        : doc.createElement("template");
      template.innerHTML = html;
      const nodes = [...(template.content || template).childNodes];

      for (let i = 0; i < nodes.length; i++) marker.before(nodes[i]);
      return {
        html,
        nodes,
        unmount() {
          let i = content.nodes.length;
          while (i--) content.nodes[i].remove();
        },
      };
    });
  });
}

Object.assign(hta, {
  delay,
  lazy,
  raw: rawHtml,
  cache: shallowCache,
  consume,
  provide,
  key: createKeyedTemplate,
  bind: createBinding,
  render,
  suspense,
  ref: createRef,
  store: useStore,
  effect: useEffect,
  state: useState,
  memo: useMemo,
  callback: useCallback,
  action: useAction,
  debounce,
});

function patchNode(context, shared, node, props) {
  let prev = node.$$props;
  if (!prev) node.$$props = prev = { _attr: {}, _prop: {} };
  for (let type in props) {
    let value = props[type];
    if (type[0] === "o" && type[1] === "n") {
      patchEvent(context, node, prev, type.substr(2), value);
    } else if (type === "stylesheet") {
      if (value) {
        for (let name in value) {
          let sheet = value[name];
          if (sheet) {
            let id = sheet.id || name;
            createStyleSheet(id, sheet.text);
          }
        }
      }
    } else if (type === "class") {
      patchClass(context, node, prev, type, value);
    } else if (type === "style") {
      patchStyle(context, node, prev, type, value);
    } else if (type === "ref") {
      typeof value === "function"
        ? value(node)
        : value && (value.current = node);
    } else if (type === "attr") {
      for (let attr in value) {
        if (prev._attr[attr] === value[attr]) continue;
        node.setAttribute(attr, (prev._attr[attr] = value[attr]));
      }
    } else if (type === "prop") {
      for (let prop in value) {
        if (prev._prop[prop] === value[prop]) continue;
        node[prop] = prev._prop[prop] = value[prop];
      }
    } else if (type === "visible") {
      node.classList.toggle(hideClassName, !value);
    } else if (type === "once") {
    } else if (value !== prev[type]) {
      if (value && value.type === dynamicBindingType) {
        if (!node.$$dynamicBindings) node.$$dynamicBindings = new WeakSet();
        if (!node.$$dynamicBindings.has(value)) {
          node.$$dynamicBindings.add(value);
          value.watch(node, type);
        }
      } else {
        node[type] = prev[type] = value;
      }
    }
  }
}

function patchClass(context, node, prev, type, value) {
  if (typeof value === "object") {
    prev.class = undefined;
    for (let token in value) {
      // noinspection JSUnfilteredForInLoop
      node.classList.toggle(token, !!value[token]);
    }
  } else {
    if (prev.class === value) return;
    prev.class = value;
    node.className = getNodeInitialData(node).class + value;
  }
}

function patchStyle(context, node, prev, type, value) {
  if (typeof value === "object") {
    prev.style = undefined;
    for (let prop in value) {
      // noinspection JSUnfilteredForInLoop
      if (prop[0] === "-") {
        node.style.setProperty(prop, value[prop]);
      } else {
        node.style[prop] = value[prop];
      }
    }
  } else {
    if (prev.style === value) return;
    prev.style = value;
    node.style = getNodeInitialData(node).style + value;
  }
}

function getNodeInitialData(node) {
  if (!node.$$initial) {
    node.$$initial = {
      style: (node.getAttribute("style") || "") + ";",
      class: (node.getAttribute("class") || "") + " ",
    };
  }
  return node.$$initial;
}

function patchEvent(context, node, prev, event, action) {
  let key = "e:" + event;
  let prevHandler = prev[key];
  if (
    prevHandler === action ||
    (prevHandler &&
      (prevHandler.action === action ||
        (isArray(action) && arrayEqual(action, prevHandler.action))))
  ) {
    return;
  }
  let debounceMs, debounceCall;
  if (isPlainObject(action)) {
    debounceMs = action.debounce;
    if ("payload" in action) {
      action = [action.action, action.payload];
    } else {
      action = action.action;
    }
  }
  let handler = (e) => {
    if (debounceMs) {
      debounceCall = executeDebounce(
        () => context.store.dispatch(action, e),
        debounceMs,
        debounceCall
      );
      return;
    }
    return context.store.dispatch(action, e);
  };
  prev[key] = handler;
  handler.action = action;
  // custom event
  if (event[0] === "$") {
    if (prevHandler) {
      node.removeEventListener(event.substr(1), prevHandler);
    }
    node.addEventListener(event.substr(1), handler);
  } else {
    node["on" + event] = handler;
  }
}

function executeDebounce(fn, ms, prevCall) {
  prevCall && prevCall.cancel();
  let timer = setTimeout(fn, ms);
  return {
    cancel() {
      clearTimeout(timer);
    },
  };
}

function renderContent(context, shared, marker, content) {
  if (
    typeof content === "function" ||
    (isArray(content) && typeof content[0] === "function")
  ) {
    return renderComponent(
      context,
      shared,
      marker,
      content[0] || content,
      content[1]
    );
  }
  if (isArray(content)) return renderList(context, shared, marker, content);
  if (isPlainObject(content)) {
    if (content.type === templateType)
      return renderTemplate(context, shared, marker, content);
  }
  renderValue(context, shared, marker, content);
}

function createPropSelector(input) {
  if (isArray(input)) return (state) => input.map((s) => state[s]);
  return (state) => state[input];
}

function initComponentContent(context, shared, marker, component, content) {
  let unsubscribe;
  let prev = [];
  let error = undefined;
  let props;
  let updateAsyncToken;
  let store = context.store;
  let innerMarker = createMarker(component.name);
  let unmounted = false;

  function forceUpdate() {
    if (unmounted) throw new Error("Cannot update unmounted component");
    if (error) throw error;
    prev = [];
    content.hooks.reset();
    let prevRenderContext = renderingContext.current;
    try {
      renderingContext.current = { component: content, context, shared };
      arguments.length && (props = arguments[0]);
      let result = component(props);
      renderContent(context, shared, innerMarker, result);
      // unmounted
      content.nodes = innerMarker.$$content ? innerMarker.$$content.nodes : [];
      fireEvent(content, "update");
    } catch (e) {
      if (
        !isPromiseLike(e) ||
        !shared.handleLoading ||
        !shared.handleLoading(e)
      )
        throw e;
    } finally {
      renderingContext.current = prevRenderContext;
    }
  }

  function handleStateChange() {
    if (unmounted) return;
    error = undefined;
    try {
      if (
        !prev.length ||
        prev.every((x) =>
          isEqual(x.selector(store.getState(), valueOf), x.value)
        )
      )
        return;
    } catch (e) {
      if (
        !isPromiseLike(e) ||
        !shared.handleLoading ||
        !shared.handleLoading(e)
      )
        error = e;
    }
    forceUpdate();
  }

  return {
    marker: innerMarker,
    hooks: createHookCollection(marker),
    store(selector) {
      if (!arguments.length) return context.store;
      if (!unsubscribe) {
        unsubscribe = store.subscribe(handleStateChange);
      }
      if (typeof selector !== "function")
        selector = createPropSelector(selector);
      let state = store.getState();
      let value = selector(state, valueOf);
      prev.push({ selector, value });
      return value;
    },
    forceUpdate,
    forceUpdateAsync() {
      let token = (updateAsyncToken = {});
      enqueue1(() => {
        token === updateAsyncToken && forceUpdate();
      });
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      unsubscribe && unsubscribe();
      content.hooks.unmount();
      tryUnmount(innerMarker);
      innerMarker.remove();
    },
    update(nextProps) {
      if (props && objectEqual(nextProps, props)) return;
      forceUpdate(nextProps);
    },
  };
}

function renderComponent(
  context,
  shared,
  marker,
  component,
  props = emptyObject
) {
  if (component.type === customRendererType) {
    return component(context, shared, marker, props);
  }
  let content = getContent(marker, component, (content) =>
    initComponentContent(context, shared, marker, component, content)
  );
  content.update(props);
}

function renderTemplate(context, shared, marker, template) {
  tryUnmount(
    marker,
    (c) =>
      c.type !== templateType ||
      !arrayEqual(c.template.strings, template.strings)
  );
  let isNew = false;
  let content = getContent(marker, templateType, (content) => {
    isNew = true;
    return {
      ...template.render(marker),
      template,
      unmount() {
        let nodes = content.nodes;
        let i = nodes.length;
        while (i--) {
          tryUnmount(nodes[i]);
          nodes[i].remove();
        }
      },
    };
  });
  if (!isNew) {
    const result = template.render(marker, template, content);
    content.nodes = result.nodes;
    content.slots = result.slots;
  }

  let i = content.slots.length;
  while (i--) {
    let slot = content.slots[i];
    let j = slot.bindings.length;
    while (j--) {
      let b = slot.bindings[j];
      if (b.type === placeholderType) {
        renderContent(context, shared, slot.node, b.value);
      } else if (b.value) {
        if (!slot.node.$$bindings) slot.node.$$bindings = {};
        if (b.value === slot.node.$$bindings[j]) continue;
        slot.node.$$bindings[j] = b.value;
        let binding =
          typeof b.value === "function" ? b.value(slot.node) : b.value;
        patchNode(context, shared, slot.node, binding);
      }
    }
  }
}

function removeItem({ marker }) {
  tryUnmount(marker);
  marker.remove();
}

function getItemAndKey(list, i) {
  let item = list[i];
  let key = undefined;
  if (isArray(item) && typeof item[0] === "function") {
    key = (item[1] || noop).key;
  } else if (item) {
    key = item.key;
  }
  return [item, typeof key === "undefined" ? i : key];
}

function renderList(context, shared, marker, list) {
  let content = getContent(marker, listType, (content) => ({
    // { key, marker, nodes, item }
    children: [],
    keyToIndex: {},
    unmount() {
      let i = content.children.length;
      while (i--) removeItem(content.children[i]);
    },
  }));

  if (list === content.list) return;
  content.list = list;

  let children = [];
  let keyToIndex = {};
  let mappedItems = [];
  for (let i = 0; i < list.length; i++) {
    let [item, key] = getItemAndKey(list, i);
    let prevChild = content.children[content.keyToIndex[key]];
    mappedItems[i] = item;
    if (!prevChild) {
      children[i] = { key, item };
    } else {
      children[i] = { ...prevChild };
    }
    keyToIndex[key] = i;
    content.keyToIndex[key] = undefined;
  }

  for (let i = content.children.length - 1; i >= 0; i--) {
    let prevChild = content.children[i];
    if (typeof content.keyToIndex[prevChild.key] !== "undefined") {
      content.children.splice(i, 1);
      removeItem(prevChild);
    }
  }

  let lastNode = null;
  let container = marker.parentNode;
  for (let i = list.length - 1; i >= 0; i--) {
    let nextChild = children[i];
    let prevChild = content.children[i];
    let hasChange = mappedItems[i] !== nextChild.item;
    nextChild.item = mappedItems[i];
    if (!nextChild.marker) {
      hasChange = true;
      nextChild.marker = createMarker("item " + i);
      container.insertBefore(nextChild.marker, lastNode);
    }
    hasChange &&
      renderContent(context, shared, nextChild.marker, nextChild.item);
    let nodes = nextChild.marker.$$content.nodes;
    if (!prevChild || nextChild.key !== prevChild.key) {
      for (let i = 0; i < nodes.length; i++) {
        container.insertBefore(nodes[i], lastNode);
      }
    }
    lastNode = nodes[0];
  }

  content.children = children;
  content.keyToIndex = keyToIndex;
}

function renderValue(context, shared, marker, value) {
  let content = getContent(marker, textType, () => {
    let textNode = doc.createTextNode("");
    marker.before(textNode);
    return {
      nodes: [textNode],
      unmount() {
        textNode.remove();
      },
    };
  });
  if (content.value === value) return;
  content.value = value;
  content.nodes[0].nodeValue =
    typeof value === "boolean" || value === null || typeof value === "undefined"
      ? ""
      : "" + value;
}

function tryUnmount(marker, shouldUnmount = true) {
  let content = marker.$$content;
  if (content && (shouldUnmount === true || shouldUnmount(content))) {
    content.unmount && content.unmount();
    marker.$$content = undefined;
    marker.$$unmounted = true;
  }
}

function render(
  content,
  {
    container = doc.body,
    state = emptyObject,
    middleware,
    onLoad,
    onChange,
    onUpdate,
    selectors,
  } = emptyObject
) {
  if (typeof container === "string") container = doc.querySelector(container);
  if (!container) return;
  let marker = createMarker("app");
  let selectorMap = {};

  if (selectors) {
    for (let key in selectors) {
      let fn = selectors[key];
      let selector = createSelector(fn, resolveSelector);
      state[key] = selectorMap[key] = () => selector(store.getState());
    }
  }

  let store = createStore(state);
  let watchToken;
  if (middleware) store = middleware(store);

  store.subscribe(() => {
    typeof onChange === "function" && onChange({ type: "change", target: app });
    isComponent && marker.$$content.forceUpdate(store.getState());
    typeof onUpdate === "function" && onUpdate({ type: "update", target: app });
  });

  let context = {
    store,
    watch,
  };
  let shared = {};
  let isComponent = false;
  let app = {
    ...store,
    get state() {
      return store.getState();
    },
  };

  function resolvePropValue(obj, prop) {
    // is method invoking
    if (prop.charAt(prop.length - 1) === ")") {
      let cachedMethodInvoking = cachedMethodInvokings[prop];
      if (!cachedMethodInvoking) {
        const [method, rawArgs] = prop.split(/[()]/);
        cachedMethodInvoking = cachedMethodInvokings[prop] = {
          method,
          args: rawArgs.split(",").map((x) => x.trim()),
        };
      }
      return obj[cachedMethodInvoking.method](...cachedMethodInvoking.args);
    }
    return obj[prop];
  }

  function resolveSelector(name) {
    let selector = selectorMap[name];
    if (!selector) {
      const props = name.match(/(\([^)]*\)|[^.])+/g);
      selectorMap[name] = selector = (state) =>
        props.reduce((prev, prop) => resolvePropValue(prev, prop), state);
    }
    return selector;
  }

  function startWatching() {
    if (!context.$$watch) return;
    let token = (watchToken = {});
    enqueue2(function tick() {
      if (token !== watchToken) return;
      fireEvent(context, "watch");
      if (hasEvent(context, "watch")) enqueue2(tick);
    });
  }

  function watch(watcher) {
    let removeWatcher = addListener(context, "watch", watcher);
    startWatching();
    return removeWatcher;
  }

  container.innerHTML = "";
  container.appendChild(marker);
  if (typeof content === "function") {
    isComponent = true;
    content = [content, store.getState()];
  }
  renderContent(context, shared, marker, content);
  typeof onLoad === "function" && onLoad({ type: "load", target: app });

  return app;
}

function createMarker(name) {
  if (debugMode) return doc.createComment(name || "");
  return doc.createTextNode("");
}

function createStore(initial) {
  if (
    initial &&
    (typeof initial.dispatch === "function" ||
      typeof initial.getState === "function")
  ) {
    return initial;
  }

  let eventSource = {};
  let originalState;
  let dispatchingScopes = 0;
  let pendingChanges;
  let updateTimer;
  let state = emptyObject;

  function lazyUpdateState(changes) {
    clearTimeout(updateTimer);
    pendingChanges = { ...pendingChanges, ...changes };
    updateTimer = setTimeout(updateState, 0, pendingChanges);
  }

  function updateState(changes) {
    if (!changes) return;
    let next = state;
    for (let prop in changes) {
      let value = changes[prop];
      // noinspection JSUnfilteredForInLoop
      if (next[prop] !== value) {
        if (next === state) {
          next = { ...state };
        }
        if (isPromiseLike(value)) {
          let promise = value;
          next[prop] = loadable(promise, {
            last: next[prop],
            onDone(loadable) {
              state[prop] === promise && lazyUpdateState({ [prop]: loadable });
            },
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

  function bulkDispatch(actions) {
    for (let i = 0; i < actions.length; i++) {
      if (!isArray(actions[i])) {
        throw new Error(
          "Expect tuple [action, payload] but got " + typeof actions[i]
        );
      }
      dispatch(actions[i][0], actions[i][1]);
    }
  }

  function dispatch(action, payload) {
    try {
      if (!dispatchingScopes) {
        originalState = state;
      }
      dispatchingScopes++;
      if (isArray(action)) {
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

      let result = action(state, payload);

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

      if (isArray(result)) {
        // update state and dispatch action later on
        // [changes, action, payload?]
        if (typeof result[0] !== "function") {
          if (isArray(result[0])) {
            return bulkDispatch(result);
          }
          updateState(result[0]);
          // multiple actions
          if (isArray(result[1])) {
            return bulkDispatch(result.slice(1));
          }
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
    dispatch,
  };
}

function isPromiseLike(obj) {
  return obj && typeof obj.then === "function";
}

function addListener(target, event, listener) {
  let key = "$$" + event;
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

function hasEvent(target, event) {
  let key = "$$" + event;
  let listeners = target[key];
  return listeners && listeners.length;
}

function fireEvent(target, event, payload, dispatcher) {
  let key = "$$" + event;
  let listeners = target[key];
  if (!listeners) return;
  if (!listeners.pendingRemove) listeners.pendingRemove = new Set();
  listeners.firing++;
  try {
    // skip new listeners
    let length = listeners.length;

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

export function loadable(value, options = emptyObject) {
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
              loadable(undefined, {
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
              loadable(undefined, {
                status: "failed",
                error,
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
    },
  };
}

function createHookCollection(container) {
  let index = -1;
  let currentCount = 0;
  let prevCount = undefined;
  let unsubscribeDestroyEvent;
  let disposeCount = 0;
  let hooks = [];

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
    ref(initial) {
      index++;
      let hook = hooks[index];
      if (!hook) {
        hooks[index] = hook = {
          type: refHookType,
          value: {
            current: typeof initial === "function" ? initial() : initial,
          },
        };
      }
      return hook.value;
    },
    unmount() {
      if (!disposeCount) return;
      for (let i = 0; i < hooks.length; i++) {
        if (typeof hooks[i].dispose === "function") {
          hooks[i].dispose();
        }
      }
    },
    get(type, initial, deps = emptyArray) {
      index++;
      let hook = hooks[index];
      if (hook) {
        if (hook.type !== type) throw new Error("Invalid hook order");
        // re-create hook if deps changed
        if (
          deps === false ||
          hook.deps === false ||
          !arrayEqual(hook.deps, deps)
        ) {
          if (hook && hook.dispose) {
            disposeCount--;
            if (!disposeCount && unsubscribeDestroyEvent) {
              unsubscribeDestroyEvent();
              unsubscribeDestroyEvent = undefined;
            }
            hook.dispose();
          }
          hook = undefined;
        }
      }
      if (!hook) {
        hooks[index] = hook = { type, deps, ...initial() };
        hook.dispose && disposeCount++;
      }
      return hook.result();
    },
  };
}

function createStyleSheet(id, text) {
  if (activeSheets[id]) return;
  let styleElement = doc.createElement("style");
  styleElement.id = id;
  styleElement.type = "text/css";

  let styleContainer = doc.querySelector("head") || doc.body;

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = text;
  } else {
    styleElement.appendChild(doc.createTextNode(text));
  }
  styleContainer.appendChild(styleElement);
  activeSheets[id] = true;
}

export function valueOf(loadable) {
  if (isArray(loadable)) {
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

function init() {
  if (typeof window !== "undefined") window.hta = hta;
  createStyleSheet(
    "hta-styles",
    `.${hideClassName} {display: none !important;}`
  );
}

init();

/*!
 * Check if an item is a plain object or not
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Object}  obj  The item to check
 * @return {Boolean}      Returns true if the item is a plain object
 */
export function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function createSelector(selector, resolver) {
  if (typeof selector === "function") {
    if (selector.type === selectorType) return selector;

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
            const result = selector(...args);
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
        type: selectorType,
      }
    );
  }
  if (typeof selector === "string") {
    let runtimeSelector = noop;
    return function () {
      if (runtimeSelector === noop) {
        runtimeSelector = resolver(selector);
      }
      if (!runtimeSelector)
        throw new Error("No named selector " + selector + " found");
      return runtimeSelector(...arguments);
    };
  }

  if (Array.isArray(selector)) {
    if (selector.length === 1 && Array.isArray(selector[0])) {
      const literal = selector[0][0];
      return () => literal;
    }
    const combiner = selector[selector.length - 1];
    const selectors = selector
      .slice(0, selector.length - 1)
      .map((s) => createSelector(s, resolver));
    const wrappedCombiner = createSelector(combiner, resolver);
    return createSelector(function () {
      return wrappedCombiner(...selectors.map((s) => s(...arguments)));
    }, resolver);
  }

  if (typeof selector === "object") {
    const entries = Object.entries(selector).map(([key, subSelector]) => [
      key,
      createSelector(subSelector, resolver),
    ]);
    let prev;
    return createSelector(function () {
      const result = {};
      let hasChange = !prev;
      entries.forEach(([key, selector]) => {
        const value = selector(...arguments);
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
