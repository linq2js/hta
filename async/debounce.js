import executeDebounce from "../core/executeDebounce";

export default function debounce(ms, fn) {
  let prev;
  return function () {
    prev = executeDebounce(() => fn.apply(null, arguments), ms, prev);
  };
}
