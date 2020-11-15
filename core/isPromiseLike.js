export default function isPromiseLike(value) {
  return value && typeof value.then === "function";
}
