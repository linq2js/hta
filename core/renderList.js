import createInstance from "./createInstance";
import createMarker from "./createMarker";
import tryGetFirstNode from "./tryGetFirstNode";
import tryReorder from "./tryReorder";
import tryUnmount from "./tryUnmount";
import { FUNC, INNER, LIST, NOOP } from "./types";
import { isArray } from "./util";

export default function renderList(
  renderContent,
  app,
  context,
  parent,
  key,
  marker,
  list
) {
  let instance = createInstance(parent, key, LIST, null, mount, [
    renderContent,
    app,
    context,
    marker,
  ]);
  instance.update(list);
}

function mount(renderContent, app, context, marker) {
  let current = {
    children: [],
    keyToIndex: new Map(),
  };

  function unmount() {
    let i = current.children.length;
    while (i--) {
      let child = current.children[i];
      tryUnmount(child[INNER]);
      child.marker.remove();
    }
  }
  function update(list) {
    if (list === current.list) return;
    let appendAll = !current.list || !current.list.length;
    current.list = list;

    let children = [];
    let keyToIndex = new Map();
    let container = marker.parentNode;
    let changeCount = 0;
    let reorderCount = 0;
    let newCount = 0;

    for (let i = 0; i < list.length; i++) {
      let [item, key] = getItemAndKey(list, i);
      let prevChild = current.children[current.keyToIndex.get(key)];
      let nextChild = prevChild ? prevChild : { key, item, changed: true };
      if (nextChild.item !== item) {
        changeCount++;
        nextChild.changed = true;
        nextChild.item = item;
      }
      if (!current.children[i] || nextChild.key !== current.children[i].key) {
        reorderCount++;
      }
      if (!prevChild) newCount++;
      children[i] = nextChild;
      keyToIndex.set(key, i);
      current.keyToIndex.delete(key);
      if (appendAll) {
        nextChild.item = item;
        nextChild.marker = createMarker("item " + i);
        container.appendChild(nextChild.marker);
        renderContent(
          app,
          context,
          nextChild,
          INNER,
          nextChild.marker,
          nextChild.item
        );
      }
    }

    if (
      !appendAll &&
      (newCount || changeCount || list.length !== current.children.length)
    ) {
      if (newCount || current.children.length !== list.length) {
        for (let i = current.children.length - 1; i >= 0; i--) {
          let child = current.children[i];
          if (current.keyToIndex.has(child.key)) {
            current.children.splice(i, 1);
            tryUnmount(child[INNER]);
            child.marker.remove();
          }
        }
      }

      if (
        !newCount &&
        !reorderCount &&
        current.children.length === list.length
      ) {
        let i = list.length;
        while (i--) {
          let child = children[i];
          if (child.changed) {
            child.changed = false;
            renderContent(app, context, child, INNER, child.marker, child.item);
          }
        }
      } else {
        let lastNode = null;
        let i = list.length;
        while (i--) {
          let nextChild = children[i];
          let prevChild = current.children[i];
          if (!nextChild.marker) {
            nextChild.marker = createMarker("item " + i);
            container.insertBefore(nextChild.marker, lastNode);
          }
          if (nextChild.changed) {
            nextChild.changed = false;
            renderContent(
              app,
              context,
              nextChild,
              INNER,
              nextChild.marker,
              nextChild.item
            );
          }
          if (prevChild && nextChild.key !== prevChild.key) {
            container.insertBefore(nextChild.marker, lastNode);
            tryReorder(nextChild[INNER]);
          }
          lastNode = tryGetFirstNode(nextChild[INNER]);
        }
      }
    }

    current.children = children;
    current.keyToIndex = keyToIndex;
  }

  function reorder() {
    if (!current.children.length) return;
    // re-order all child markers
    marker.before(...current.children.map((child) => child.marker));
    let i = current.children.length;
    while (i--) tryReorder(current.children[i][INNER]);
  }
  return {
    type: LIST,
    firstNode() {
      return current.children[0] && tryGetFirstNode(current.children[0][INNER]);
    },
    unmount,
    update,
    reorder,
  };
}

function getItemAndKey(list, i) {
  let item = list[i];
  let key = undefined;
  if (isArray(item) && typeof item[0] === FUNC) {
    key = (item[1] || NOOP).key;
  } else if (item) {
    key = item.key;
  }
  return [item, key === void 0 ? i : key];
}
