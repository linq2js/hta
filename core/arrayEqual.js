import { isArray } from "./util";

export default function arrayEqual(a, b, comparer) {
  if (isArray(a) && isArray(b) && a.length === b.length) {
    let i = a.length;
    if (comparer) {
      while (i--) if (!comparer(a[i], b[i])) return false;
    } else {
      while (i--) if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return false;
}
