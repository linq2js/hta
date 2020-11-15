import createMarker from "./createMarker";
import tryGetFirstNode from "./tryGetFirstNode";
import renderContent from "./renderContent";
import tryReorder from "./tryReorder";
import tryUnmount from "./tryUnmount";
import { INNER } from "./types";

export default function createContextWrapper(marker, extend) {
  let innerMarker = createMarker();
  let data = {};
  let instance = {
    firstNode: () => tryGetFirstNode(data[INNER]),
    render(app, context, content) {
      if (instance.unmounted) return;
      renderContent(app, context, data, INNER, innerMarker, content);
    },
    reorder() {
      if (instance.unmounted || innerMarker.nextSibling === marker) return;
      marker.before(innerMarker);
      tryReorder(data[INNER]);
    },
    unmount: () => {
      instance.unmounted = true;
      tryUnmount(data[INNER]);
    },
  };

  marker.before(innerMarker);

  extend &&
    (typeof extend === "function"
      ? extend(instance)
      : Object.assign(instance, extend));

  return instance;
}
