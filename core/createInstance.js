export default function createInstance(
  parent,
  key,
  type,
  shouldRemove,
  mount,
  args
) {
  let content = parent[key];
  if (
    content &&
    (content.type !== type || (shouldRemove && shouldRemove(content)))
  ) {
    content.unmount();
    content = null;
  }
  if (!content) {
    parent[key] = content = args ? mount.apply(null, args) : mount();
    content.type = type;
  }
  return content;
}
