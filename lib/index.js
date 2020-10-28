const propertyBindingType = () => {};
const elementBindingType = () => {};
const templateType = () => {};
const defaultKeySelector = (item, index) => index;
const defaultItemSelector = (item) => hta`<div ${{ text: item }}></div>`;

export default function hta() {
  if (!Array.isArray(arguments[0])) return renderApp(...arguments);
  return createTemplate(...arguments);
}

function renderApp(
  component,
  { state = {}, container = document.body, middleware, onChange, onUpdate } = {}
) {
  if (typeof container === "string") {
    container = document.querySelector(container);
  }

  container.innerHTML = "<template></template>";
  const listeners = [];
  let api = {
    // define API that compatibles with redux store
    getState() {
      return state;
    },
    subscribe(listener) {
      let active = true;
      listeners.push(listener);
      return function () {
        if (!active) return;
        active = true;
        const index = listeners.indexOf(listener);
        index !== -1 && listeners.splice(index, 1);
      };
    },
    dispatch(action, payload) {
      if (typeof action !== "function") return action;

      const result = action(state, payload);

      if (!result) return result;

      if (isPromiseLike(result)) {
        return result.then(dispatch, dispatch);
      }
      if (typeof result === "function") return dispatch(result);
      if (Array.isArray(result)) {
        // multiple dispatching
        if (Array.isArray(result[0])) return result.forEach(dispatch);
        return dispatch(result);
      }
      if (result && typeof result === "object") {
        let next = state;
        for (const prop in result) {
          // noinspection JSUnfilteredForInLoop
          if (next !== result[prop]) {
            if (next === state) {
              next = { ...next };
            }
            next[prop] = result[prop];
          }
        }
        if (next !== state) {
          state = next;
          typeof onChange === "function" && onChange(state);
          update();
          typeof onUpdate === "function" && onUpdate(state);
          const copyOfListeners = listeners.slice();
          for (let i = 0; i < copyOfListeners.length; i++) {
            copyOfListeners[i](state);
          }
        }
      }
    },
  };

  if (middleware) {
    api = middleware(api);
  }

  const context = {
    ...api,
    dispatch,
  };
  const data = {
    container: container.firstElementChild,
  };

  function dispatch(action, payload) {
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

    return api.dispatch(action, payload);
  }

  function update() {
    renderTemplate(
      context,
      data,
      typeof component === "function" ? [component, api.getState()] : component
    );
  }

  update();

  return {
    ...api,
    get state() {
      return api.getState();
    },
    dispatch,
    update,
  };
}

function renderTemplate(context, data, template) {
  if (typeof template === "function") {
    template = [template];
  }
  if (Array.isArray(template)) {
    return renderComponent(context, data, ...template);
  }
  if (!template || template.type !== templateType) {
    template = createTemplate(["", ""], template);
  }

  if (
    !data.strings ||
    data.strings.length !== template.strings.length ||
    data.strings.some((str, index) => str !== template.strings[index])
  ) {
    data.container.innerHTML =
      template.bindings
        .map((binding, index) => {
          const bindingTemplate =
            binding.type === propertyBindingType
              ? // create temp attribute
                ` __${index} `
              : // create template element as placeholder
                `<template id="__${index}"></template>`;

          return template.strings[index] + bindingTemplate;
        })
        .join("") + template.strings[template.strings.length - 1];
    if (data.slots && data.slots.length) {
      for (let i = 0; i < data.slots.length; i++) {
        tryUnmount(data.slots[i]);
      }
    }
    // collect placeholders
    data.slots = template.bindings.map((binding, index) => {
      const key = `__${index}`;
      const container = data.container.content.querySelector(
        binding.type === propertyBindingType ? `[${key}]` : `#${key}`
      );
      // clean up container
      container.removeAttribute(key);
      container.removeAttribute("id");

      return {
        container,
        template: container,
      };
    });
    if (process.env.NODE_ENV !== "production") {
      const elementCount = data.container.content.children.length;
      if (elementCount !== 1) {
        throw new Error(
          `The template requires only 1 element at root but got ${elementCount}. ` +
            template.strings.join("$$SLOT")
        );
      }
    }
    data.container = replaceNode(
      data.container.content.firstElementChild,
      data.container
    );

    data.strings = template.strings;
  }

  for (let i = 0; i < template.bindings.length; i++) {
    const binding = template.bindings[i];
    binding.patch(context, data.slots[i]);
  }
}

function createTemplate(strings, ...args) {
  let bindings;

  return {
    type: templateType,
    strings,
    get bindings() {
      if (bindings) return bindings;
      bindings = args.map((arg) => {
        if (typeof arg === "function") return createComponentBinding(arg);
        if (Array.isArray(arg)) {
          if (typeof arg[0] === "function") {
            return createComponentBinding(...arg);
          }
          return createConditionalBinding(...arg);
        }
        if (typeof arg === "object" && arg !== null) {
          if (arg.type === templateType) return createTemplateBinding(arg);
          if (arg instanceof Date || arg instanceof RegExp) {
            return createTextBinding(arg);
          }
          return createPropertyBinding(arg);
        }
        return createTextBinding(arg);
      });
      return bindings;
    },
  };
}

function tryUnmount(data) {
  if (!data || typeof data.unmount !== "function") return;
  data.unmount();
  delete data.unmount;
}

function replaceNode(newNode, oldNode) {
  oldNode.parentNode.replaceChild(newNode, oldNode);
  return newNode;
}

function createTextBinding(value) {
  return {
    type: elementBindingType,
    patch(context, data) {
      renderText(context, data, value);
    },
  };
}

function renderText(context, data, value) {
  if (data.container.tagName === "TEMPLATE") {
    data.container = replaceNode(document.createTextNode(""), data.container);
  }
  if (data.value === value) {
    return;
  }
  data.value = value;
  // dont render bool, null, undefined values
  data.container.nodeValue =
    value === undefined || value === null || typeof value === "boolean"
      ? ""
      : value;
}

function createTemplateBinding(template) {
  return {
    type: elementBindingType,
    patch(context, data) {
      renderTemplate(context, data, template);
    },
  };
}

function createPropertyBinding(props) {
  return {
    type: propertyBindingType,
    patch(context, data) {
      //
      if ("each" in props) {
        renderChildren(context, data, props.each, props.key, props.item);
      }

      for (const name in props) {
        // noinspection JSUnfilteredForInLoop
        const value = props[name];
        switch (name[0]) {
          case "$":
            patchEvent(context, data, name, value);
            break;
          case "@":
            patchAttribute(context, data, name, value);
            break;
          case ".":
            patchProperty(context, data, name, value);
            break;
          default:
            switch (name) {
              case "id":
              case "for":
              case "title":
              case "href":
                patchAttribute(context, data, name, value);
                break;
              case "checked":
              case "disabled":
              case "value":
              case "selected":
              case "multiple":
              case "name":
                patchProperty(context, data, name, value);
                break;
              case "class":
                patchClass(context, data, value);
                break;
              case "style":
                patchStyle(context, data, value);
                break;
              case "html":
                patchHtml(context, data, value);
                break;
              case "text":
                patchText(context, data, value);
                break;
              default:
              // not support
            }
            break;
        }
      }

      if (typeof props.init === "function" && !data.container.$$initialized) {
        // support multiple init action binding on single element
        clearTimeout(data.container.$$initTimeout);
        data.container.$$initTimeout = setTimeout(
          () => (data.container.$$initialized = true)
        );
        props.init.call(data.container);
      }
    },
  };
}

function getNodeInitialData(node) {
  if (!node.__initialData) {
    node.__initialData = {
      style: (node.getAttribute("style") || "") + ";",
      class: (node.getAttribute("class") || "") + " ",
    };
  }
  return node.__initialData;
}

function patchClass(context, data, value) {
  if (data.class === value) return;
  if (typeof value === "object") {
    for (const token in value) {
      // noinspection JSUnfilteredForInLoop
      data.container.classList.toggle(token, !!value[token]);
    }
  } else {
    data.container.className = getNodeInitialData(data.container).class + value;
  }
}

function patchStyle(context, data, value) {
  if (data.style === value) return;
  data.style = value;
  if (typeof value === "object") {
    for (const prop in value) {
      // noinspection JSUnfilteredForInLoop
      if (prop[0] === "-") {
        data.container.style.setProperty(prop, value[prop]);
      } else {
        data.container.style[prop] = value[prop];
      }
    }
  } else {
    data.container.style = getNodeInitialData(data.container).style + value;
  }
}

function patchText(context, data, value) {
  if (data.text === value) return;
  data.text = value;
  data.container.textContent = value;
}

function patchHtml(context, data, value) {
  if (data.html === value) return;
  data.html = value;
  data.container.innerHTML = value;
}

function patchProperty(context, data, prop, value) {
  const key = "p:" + prop;
  if (data[key] === value) return;
  data[key] = value;
  data.container[prop] = value;
}

function patchAttribute(context, data, attr, value) {
  const key = "a:" + attr;
  if (data[key] === value) return;
  data[key] = value;
  data.container.setAttribute(attr, value);
}

function patchEvent(context, data, event, action) {
  const key = "e:" + event;
  const prevHandler = data[key];
  if (prevHandler === action) {
    return;
  }
  const handler = (e) => context.dispatch(action, e);
  data[key] = handler;
  handler.action = action;
  // custom event
  if (event[0] === "$") {
    if (prevHandler && prevHandler.action === action) return;
    if (prevHandler) {
      data.container.removeEventListener(event.substr(1), prevHandler);
    }
    data.container.addEventListener(event.substr(1), handler);
  } else {
    data.container["on" + event] = handler;
  }
}

function renderChildren(
  context,
  data,
  items,
  keySelector = defaultKeySelector,
  itemSelector = defaultItemSelector
) {
  if (!data.nodeMap) {
    data.nodeMap = {};
    data.keyList = [];
    data.children = {};
  }
  const nodeMap = {};
  const keyList = [];
  for (let i = 0; i < items.length; i++) {
    const key = keySelector ? keySelector(items[i], i) : i;
    const prevNode = data.nodeMap[key];
    if (!prevNode) {
      nodeMap[key] = document.createElement("template");
    } else {
      nodeMap[key] = prevNode;
    }
    keyList[i] = key;
    delete data.nodeMap[key];
  }

  for (let i = data.keyList.length - 1; i >= 0; i--) {
    const key = data.keyList[i];
    const prevNode = data.nodeMap[key];
    if (prevNode) {
      const childData = data.children[key];
      tryUnmount(childData);
      delete data.children[key];
      data.keyList.splice(i, 1);
      data.container.removeChild(prevNode);
    }
  }

  let lastNode = null;
  for (let i = items.length - 1; i >= 0; i--) {
    const key = keyList[i];
    let node = nodeMap[key];
    if (key !== data.keyList[i]) {
      data.container.insertBefore(node, lastNode);
    }
    const item = items[i];
    const result = itemSelector(item, i);
    let childData = data.children[key];
    if (!childData) {
      childData = {};
      data.children[key] = childData;
    }
    childData.container = node;
    renderTemplate(context, childData, result);
    // update modified node
    lastNode = nodeMap[key] = childData.container;
  }

  data.nodeMap = nodeMap;
  data.keyList = keyList;
}

function createStateHook(initial, data) {
  let state = initial;
  const api = [state, set];

  function set(value, callback) {
    if (typeof value === "function") {
      value = value(state);
    }
    if (value !== state) {
      api[0] = state = value;
      data.update();
      typeof callback === "function" && callback();
    }
  }

  return api;
}

function initComponentData(data, context, component) {
  if (data.initialized) return;
  let hookIndex = 0;
  let selectorMap = new WeakMap();
  let selectorArray = [];
  let unsubscribe;
  const hooks = [];

  function getHook(type, initializer) {
    let hook = hooks[hookIndex];
    if (!hook) {
      hook = { type, data: initializer() };
      hooks[hookIndex] = hook;
    } else if (hook.type !== type) {
      throw new Error("Invalid hook order");
    }
    hookIndex++;
    return hook.data;
  }

  function isStateChanged() {
    return (
      selectorArray.length &&
      // no state slice changed
      selectorArray.some(
        (selector) => selectorMap.get(selector) !== selector(context.getState())
      )
    );
  }

  function handleStateChange() {
    if (!isStateChanged()) return;
    data.update();
  }

  data.unmount = function () {
    typeof unsubscribe === "function" && unsubscribe();
  };

  data.select = function (selector) {
    if (typeof selector !== "function") {
      return getHook("state", () => createStateHook(selector, data));
    }
    if (!selectorMap.has(selector)) {
      selectorArray.push(selector);
    }
    const value = selector(context.getState());
    selectorMap.set(selector, value);
    if (!unsubscribe) {
      unsubscribe = context.subscribe(handleStateChange);
    }
    return value;
  };

  data.shouldUpdate = function (nextProps) {
    if (
      !data.props ||
      // no prop changed
      !isEqual(data.props, nextProps) ||
      isStateChanged()
    ) {
      data.props = nextProps;

      return true;
    }

    return false;
  };

  data.update = function () {
    selectorArray = [];
    selectorMap = new WeakMap();
    hookIndex = 0;
    const result = component(data.props, data.select);
    if (
      typeof result === "function" ||
      (Array.isArray(result) && typeof result[0] === "function")
    ) {
      return renderComponent(context, data, ...[].concat(result));
    }
    renderTemplate(context, data, result);
  };
}

function renderComponent(context, data, component, props) {
  if (!data.initialized) {
    initComponentData(data, context, component);
  }
  if (!data.shouldUpdate(props)) return;
  data.update();
}

function createConditionalBinding(condition, target, ...args) {
  return {
    type: elementBindingType,
    patch(context, data) {
      if (!data.comment) {
        data.comment = document.createComment("conditional");
        data.container.parentNode.insertBefore(data.comment, data.container);
      }
      if (data.condition === condition) return;
      data.condition = condition;
      if (condition) {
        if (data.renderedNode) {
          data.comment.parentNode.insertBefore(
            data.renderedNode,
            data.comment.nextSibling
          );
        }
        if (typeof target === "function") {
          renderComponent(context, data, target, ...args);
        } else if (target && target.type === templateType) {
          renderTemplate(context, data, target);
        } else {
          renderText(context, data, target);
        }
        data.renderedNode = data.comment.nextSibling;
      } else {
        tryUnmount(data);
        delete data.initialized;
        delete data.props;
        if (data.renderedNode && data.comment.parentNode) {
          data.comment.parentNode.removeChild(data.renderedNode);
        }
      }
    },
  };
}

function createComponentBinding(component, props = {}) {
  return {
    type: elementBindingType,
    patch(context, data) {
      renderComponent(context, data, component, props);
    },
  };
}

function isPromiseLike(obj) {
  return obj && typeof obj.then === "function";
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

  const comparer = (key) => {
    return a[key] === b[key];
  };
  return Object.keys(a).every(comparer) && Object.keys(b).every(comparer);
}
