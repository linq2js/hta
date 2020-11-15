export default function executeDebounce(fn, ms, prevCall) {
  prevCall && prevCall.cancel();
  let timer = setTimeout(fn, ms);
  return {
    cancel() {
      clearTimeout(timer);
    },
  };
}
