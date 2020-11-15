import createInstance from "./createInstance";
import { DOC, TEXT } from "./types";

export default function renderText(app, context, parent, key, marker, data) {
  let instance = createInstance(parent, key, TEXT, null, mount, [marker]);
  instance.update(data);
}

function mount(marker) {
  let node = marker; // DOC.createTextNode("");
  let prevData;
  // marker.before(node);

  function update(data) {
    if (data === prevData) return;
    prevData = data;
    node.nodeValue =
      prevData === null ||
      prevData === void 0 ||
      typeof prevData === "boolean"
        ? ""
        : data;
  }

  function reorder() {
    marker.before(node);
  }

  function unmount() {
    node.nodeValue = '';
    // node.remove();
  }

  return {
    get firstNode() {
      return node;
    },
    reorder,
    unmount,
    update,
  };
}
