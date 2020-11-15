import { LOADABLE } from "../core/types";
import { isArray } from "../core/util";

export default function valueOf(loadable) {
  if (isArray(loadable)) {
    return loadable.map((item) => {
      if (item && item.type === LOADABLE) {
        return item.value;
      }
      return item;
    });
  }
  if (loadable && loadable.type === LOADABLE) {
    return loadable.value;
  }
  return loadable;
}
