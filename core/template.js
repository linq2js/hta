import createArrayKeyedMap from "./createArrayKeyedMap";
import createMarker from "./createMarker";
import { DIRECTIVE, DOC, EMPTY_ARRAY, PLACEHOLDER, TEMPLATE } from "./types";
import { indexOf, slice } from "./util";

let cache = createArrayKeyedMap(parseTemplate);
let TEMPLATE_ELEMENT = "template";
let SLOT_ATTRIBUTE = "hta-slot";
let SLOT_TOKEN = "@@hta";
let PATTERN = /(?:<\/?[^\s>]+|@@hta|>)/g;

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

export function parseTemplate(parts) {
  let id = Symbol();
  if (parts.length === 1)
    return { id, html: parts[0], query: null, slots: EMPTY_ARRAY };

  let slots = [];
  let html = [];
  let query = [];
  // unknown = 0, openTag = 1, singleQuote = 2, doubleQuote = 3
  let current = 0;
  let matches = [...parts.join(SLOT_TOKEN).matchAll(PATTERN)];
  while (matches.length) {
    let [match] = matches.shift();
    switch (match[0]) {
      case "<":
        current = match[1] === "/" ? 0 : 1;
        break;
      case ">":
        current = 0;
        break;
      case "@":
        let attr = `hta-${slots.length}`;
        query.push(`[${attr}="1"]`);
        html.push(
          current === 1
            ? ` ${attr}="1" `
            : `<${TEMPLATE_ELEMENT} ${SLOT_ATTRIBUTE}="1" ${attr}="1"></${TEMPLATE_ELEMENT}>`
        );
        slots[slots.length] = current === 1 ? DIRECTIVE : PLACEHOLDER;
        break;
    }
  }

  return {
    id,
    html: parts.reduce(
      (prev, current, index) => prev + html[index - 1] + current
    ),
    query: query.join(","),
    slots,
  };
}
