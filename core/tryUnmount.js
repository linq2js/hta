export default function tryUnmount(content) {
  content && content.unmount && content.unmount();
}
