import isPromiseLike from "../core/isPromiseLike";

export default function handleGenerator(
  iterator,
  { onYield, onError, onDone, onLoading }
) {
  function next() {
    try {
      let result = iterator.next();
      if (isPromiseLike(result)) {
        onLoading && onLoading();
        result.then(({ done, value }) => {
          if (done) return onDone && onDone();
          onYield(value);
          next();
        }, onError);
      } else {
        if (result.done) return onDone && onDone();
        onYield(result.value);
      }
    } catch (error) {
      onError && onError(error);
    }
  }

  next();
}
