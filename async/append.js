import createInstance from "../core/createInstance";
import createMarker from "../core/createMarker";
import createRenderer from "../core/createRenderer";
import tryGetFirstNode from "../core/tryGetFirstNode";
import tryReorder from "../core/tryReorder";
import tryUnmount from "../core/tryUnmount";
import { APPEND, EMPTY_OBJECT, INNER } from "../core/types";
import handleGenerator from "./handleGenerator";

export default function append(iterator, options = EMPTY_OBJECT) {
  return createRenderer(function (
    app,
    context,
    parent,
    key,
    marker,
    props,
    renderContent
  ) {
    let instance = createInstance(
      parent,
      key,
      APPEND,
      (x) => x.iterator !== iterator,
      mount,
      [renderContent, marker]
    );
    instance.update(app, context, iterator, options);
  });
}

function mount(renderContent, marker) {
  let items = [];
  let currentItem;
  let isLoading = false;
  let instance = {
    firstNode() {
      return tryGetFirstNode(items[0] && items[0][INNER]);
    },
    reorder() {
      if (instance.unmounted) return;
      let i = items.length;
      while (i--) tryReorder(items[i][INNER]);
    },
    unmount() {
      if (instance.unmounted) return;
      instance.unmounted = true;
      let i = items.length;
      while (i--) {
        tryUnmount(items[i][INNER]);
        items[i].marker.remove();
      }
    },
    update,
  };

  function tryCreateItem() {
    if (currentItem) return currentItem;
    currentItem = { marker: createMarker() };
    marker.before(currentItem.marker);
    items.push(currentItem);
    return currentItem;
  }

  function update(app, context, iterator, options) {
    if (instance.iterator) return;
    let { fallback, resolve, reject } = options;
    let hasFallback = "fallback" in options;
    instance.iterator = iterator;
    handleGenerator(iterator, {
      onYield(value) {
        isLoading = false;
        let availItem = tryCreateItem();
        currentItem = null;
        renderContent(
          app,
          context,
          availItem,
          INNER,
          availItem.marker,
          resolve ? resolve(value) : value
        );
      },
      onLoading:
        hasFallback &&
        function () {
          let availItem = tryCreateItem();
          isLoading = true;
          renderContent(
            app,
            context,
            availItem,
            INNER,
            availItem.marker,
            fallback
          );
        },
      // try unmount current item if it is still loading
      onDone() {
        if (isLoading && currentItem) {
          tryUnmount(currentItem && currentItem[INNER]);
        }
      },
      onError: (error) =>
        reject
          ? instance.render(app, context, reject(error))
          : app.extras.component.error(error),
    });
  }

  return instance;
}
