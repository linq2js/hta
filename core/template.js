import arrayKeyedMap from "./arrayKeyedMap";
import createMarker from "./createMarker";
import { DIRECTIVE, DOC, EMPTY_ARRAY, PLACEHOLDER, TEMPLATE } from "./types";
import { indexOf, slice } from "./util";

let cache = arrayKeyedMap(templateProcessor);
let tagNamePattern = /^[a-z0-9_-]+/i;
let TEMPLATE_ELEMENT = "template";
let SLOT_ATTRIBUTE = "hta-slot";

export function createUnKeyedTemplate(strings) {
  if (strings.toUpperCase) strings = [strings];
  return createTemplate(undefined, strings, slice.call(arguments, 1));
}

export function createKeyedTemplate(key) {
  return function (strings) {
    return createTemplate(key, strings, slice.call(arguments, 1));
  };
}

function createTemplate(key, strings, values) {
  let data = cache.get(strings);
  let { id, html, query, slots } = data;
  return {
    id,
    key,
    type: TEMPLATE,
    equal: (other) => other.id === id,
    dynamic: !!values.length,
    values,
    render(marker) {
      if (!data.template)
        data.template = renderTemplate(marker, html, query, slots);
      let nodes = data.template.childNodes.map((node) => node.cloneNode(true));
      marker.before(...nodes);
      let bindings = [];
      let i = data.template.attachedNodes.length;
      let rootNode = { childNodes: nodes };
      while (i--) {
        let attachedNode = data.template.attachedNodes[i];
        let node = attachedNode.path.reduce(
          (parent, index) => parent.childNodes[index],
          rootNode
        );
        for (let j = 0; j < attachedNode.bindings.length; j++) {
          let binding = attachedNode.bindings[j];
          bindings.unshift({ node, type: binding.type, index: binding.index });
        }
      }

      function bind(template) {
        let i = bindings.length;
        while (i--) bindings[i].value = template.values[bindings[i].index];
      }

      return [nodes, bindings, bind];
    },
  };
}

function renderTemplate(marker, html, query, slots) {
  let ns = marker.parentNode && marker.parentNode.namespaceURI;
  let templateElement = ns
    ? DOC.createElementNS(ns, TEMPLATE_ELEMENT)
    : DOC.createElement(TEMPLATE_ELEMENT);
  templateElement.innerHTML = html;
  let attachedNodes = !query
    ? EMPTY_ARRAY
    : [
        ...(templateElement.content || templateElement).querySelectorAll(query),
      ].map((node, index) => {
        let result = {
          path: getElementPath(node),
          bindings: slots
            .map((type, index) => ({ index, type }))
            .filter((slot) => node.getAttribute(`hta-${slot.index}`) === "1"),
        };
        if (node.getAttribute(SLOT_ATTRIBUTE) === "1") {
          let marker = createMarker("placeholder " + index);
          node.before(marker);
          node.remove();
        }
        return result;
      });
  return {
    isSvg: !!ns,
    childNodes: [...(templateElement.content || templateElement).childNodes],
    attachedNodes,
  };
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

function templateProcessor(parts) {
  let id = Symbol();
  let [html, query, slots] = parseTemplate(parts);
  return { id, html, query, slots };
}

export function parseTemplate(parts) {
  if (parts.length === 1) return [parts[0], null, EMPTY_ARRAY];
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

      let result = tagNamePattern.exec(str);

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
  push(parts[0]);

  let length = parts.length - 1;
  for (let i = 0; i < length; i++) {
    if (current > 1)
      throw new Error("Cannot embed binding inside attribute values. ");
    slots[i] = current === 1 ? DIRECTIVE : PLACEHOLDER;
    let attr = `hta-${i}`;
    html.push(
      current === 1
        ? ` ${attr}="1" `
        : `<${TEMPLATE_ELEMENT} ${SLOT_ATTRIBUTE}="1" ${attr}="1"></${TEMPLATE_ELEMENT}>`
    );
    query[i] = `[${attr}="1"]`;
    push(parts[i + 1]);
  }
  return [html.join(""), query.join(","), slots];
}
