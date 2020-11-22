import { NOOP } from "./types";

let valueProp = Symbol("value");

export default function createArrayKeyedMap(defaultAdd) {
  let root = new Map();
  root.set(valueProp, NOOP);

  function getMap(key) {
    let map = root;
    for (let i = 0; i < key.length; i++) {
      let k = key[i];
      let inner = map.get(k);
      if (!inner) {
        inner = new Map();
        inner.set(valueProp, NOOP);
        map.set(k, inner);
      }
      map = inner;
    }
    return map;
  }

  return {
    get(key, add = defaultAdd) {
      let map = getMap(key);
      let value = map.get(valueProp);
      value === NOOP && add && map.set(valueProp, (value = add(key)));
      return value;
    },
    set(key, value) {
      getMap(key).set(valueProp, value);
    },
  };
}
