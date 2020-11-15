export default function delay(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}
