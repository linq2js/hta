import isPromiseLike from "../core/isPromiseLike";

export default function handleGenerator(
  iterator,
  { onYield, onError, onDone, onLoading, isCancelled }
) {
  function handleError(error) {
    if (!onError) throw error;
    onError(error);
  }

  function next(payload) {
    if (isCancelled && isCancelled()) return;
    try {
      let result = iterator.next(payload);
      if (result.done) return onDone && onDone();
      if (isPromiseLike(result.value)) {
        onLoading && onLoading();
        return result.value.then(next, handleError);
      }
      onYield(result.value);
      next();
    } catch (error) {
      handleError(error);
    }
  }

  next();
}
