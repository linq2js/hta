import createInstance from "./createInstance";
import patchNode from "./patchNode";
import { DIRECTIVE, INNER, PLACEHOLDER, TEMPLATE } from "./types";

export default function renderTemplate(
  renderContent,
  app,
  context,
  parent,
  key,
  marker,
  template
) {
  let instance = createInstance(
    parent,
    key,
    TEMPLATE,
    (x) => x.template.id !== template.id,
    mount,
    [renderContent, app, context, marker]
  );
  instance.update(template);
  instance.template = template;
}

function mount(renderContent, app, context, marker) {
  let nodes = [];
  let bindings;
  let bind;
  let dirty = false;

  function unmount() {
    let i = bindings.length;
    while (i--) {
      let binding = bindings[i];
      binding.type === PLACEHOLDER && binding[INNER].unmount();
    }
    i = nodes.length;
    while (i--) nodes[i].remove();
  }

  function update(template) {
    if (!dirty) {
      dirty = true;
      [nodes, bindings, bind] = template.render(marker);
    }
    bind(template);
    let i = bindings.length;
    while (i--) {
      let binding = bindings[i];
      switch (binding.type) {
        case PLACEHOLDER:
          renderContent(
            app,
            context,
            binding,
            INNER,
            binding.node,
            binding.value
          );
          break;
        case DIRECTIVE:
          patchNode(app, context, binding, INNER, binding.node, binding.value);
          break;
      }
    }
  }

  function reorder() {
    if (!nodes.length) return;
    // just insert all top nodes at before of marker
    marker.before(...nodes);
  }

  return {
    firstNode() {
      return nodes[0];
    },
    unmount,
    update,
    reorder,
  };
}
