import objectEqual from "./objectEqual";
import isPromiseLike from "./isPromiseLike";
import { isArray } from "./util";

export default function isEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    isPromiseLike(a) ||
    isPromiseLike(b) ||
    isArray(a) ||
    isArray(b)
  )
    return false;
  if (a === null && b) return false;
  if (b === null && a) return false;

  return objectEqual(a, b);
}
