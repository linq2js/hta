import arrayEqual from "./arrayEqual";
import executeDebounce from "./executeDebounce";
import { createUnKeyedTemplate } from "./template";
import { BINDER, NOOP } from "./types";
import { isArray } from "./util";

export default function patchNode(app, context, parent, key, node, props) {
  let prev = parent[key];
  if (!prev) {
    parent[key] = prev = {
      // visible: NOOP,
      attr: new Map(),
      prop: new Map(),
      event: new Map(),
      class: new Map(),
      style: new Map(),
    };
  }
  if (typeof props === "function") {
    props = props(node, prev);
    if (!props) return;
  }
  for (let type in props) {
    let value = props[type];
    if (type[0] === "o" && type[1] === "n") {
      if (type.length === 2) {
        if (value) {
          for (let event in value) {
            patchEvent(app, context, node, prev.event, event, value[event]);
          }
        }
      } else {
        patchEvent(app, context, node, prev.event, type.substr(2), value);
      }
    } else {
      switch (type) {
        case "class":
          patchClass(app, context, node, prev.class, type, value);
          break;
        case "style":
          patchStyle(app, context, node, prev.style, type, value);
          break;
        case "attr":
          for (let name in value) {
            patchAttribute(app, context, node, prev.attr, name, value[name]);
          }
          break;
        case "ref":
          typeof value === "function"
            ? value(node)
            : value && (value.current = node);
          break;
        case "prop":
          for (let name in value) {
            patchProperty(app, context, node, prev.prop, name, value[name]);
          }
          break;
        default:
          if (value && value.type === BINDER) {
            if (!node.$$dynamicBindings) node.$$dynamicBindings = new WeakSet();
            if (!node.$$dynamicBindings.has(value)) {
              node.$$dynamicBindings.add(value);
              value.watch(node, type);
            }
          } else {
            patchProperty(app, context, node, prev.prop, type, value);
          }
          break;
      }
    }
  }
}

function patchAttribute(app, context, node, prev, attr, value) {
  let attrNode = node.getAttributeNode(attr);
  if (attrNode) {
    if (attrNode.nodeValue !== value) attrNode.nodeValue = value;
  } else {
    node.setAttribute(attr, value);
  }
}

function patchProperty(app, context, node, prev, prop, value) {
  if (prev.get(prop) === value) return;
  prev.set(prop, value);
  if (prop === "text") {
    node.textContent = value;
  } else if (prop === "html") {
    node.innerHTML = value;
  } else {
    node[prop] = value;
  }
}

function patchEvent(app, context, node, prev, event, handler) {
  let prevHandler = prev.get(event);
  if (
    prevHandler === handler ||
    (prevHandler &&
      (prevHandler.action === handler ||
        (isArray(handler) && arrayEqual(handler, prevHandler.action))))
  ) {
    return;
  }

  let isFunc = typeof handler === "function";
  let debounceMs, debounceCall;
  if (handler && !isFunc && !isArray(handler)) {
    debounceMs = handler.debounce;
    if ("payload" in handler) {
      handler = [handler.action, handler.payload];
    } else {
      handler = handler.action;
    }
  }
  let wrapper = isFunc
    ? handler
    : (e) => {
        if (debounceMs) {
          debounceCall = executeDebounce(
            () => app.store.dispatch(handler, e),
            debounceMs,
            debounceCall
          );
          return;
        }
        if (isArray(handler)) {
          return app.store.dispatch(
            handler[0],
            typeof handler[1] === "function"
              ? // argument placeholder
                // onclick: [Action, $]
                handler[1] === createUnKeyedTemplate
                ? e
                : handler[1](e)
              : handler[1]
          );
        }
        return app.store.dispatch(handler, e);
      };
  wrapper.action = handler;
  prev.set(event, wrapper);
  if (prevHandler) node.removeEventListener(event, prevHandler);
  node.addEventListener(event, wrapper);
}

function patchClass(app, context, node, prev, type, value) {
  if (typeof value === "object") {
    prev.class = NOOP;
    let classes = value;
    for (let token in classes) {
      // noinspection JSUnfilteredForInLoop
      let flag = !!classes[token];
      if (prev.get(token) === flag) continue;
      prev.set(token, flag);
      node.classList.toggle(token, flag);
    }
  } else {
    if (prev.class === value) return;
    prev.class = value;
    node.className = getNodeInitialData(node).class + value;
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

function patchStyle(app, context, node, prev, type, value) {
  if (typeof value === "object") {
    prev.style = NOOP;
    for (let propName in value) {
      let propValue = value[propName];
      if (prev.get(propName) === propValue) continue;
      prev.set(propName, propValue);
      // noinspection JSUnfilteredForInLoop
      if (propName[0] === "-") {
        node.style.setProperty(propName, propValue);
      } else {
        node.style[propName] = propValue;
      }
    }
  } else {
    if (prev.style === value) return;
    prev.style = value;
    node.style = getNodeInitialData(node).style + value;
  }
}
