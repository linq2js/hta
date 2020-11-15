export default function objectEqual(a, b) {
  if (a === b) return true;

  for (let ka in a) {
    if (a[ka] !== b[ka]) return false;
  }
  for (let kb in b) {
    if (a[kb] !== b[kb]) return false;
  }
  return true;
}
