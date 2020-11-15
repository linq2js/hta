export let slice = [].slice;
export let indexOf = [].indexOf;
export let isArray = Array.isArray;
export let enqueue1 = Promise.resolve().then.bind(Promise.resolve());
export let enqueue2 =
  typeof requestAnimationFrame === "undefined"
    ? enqueue1
    : requestAnimationFrame;
