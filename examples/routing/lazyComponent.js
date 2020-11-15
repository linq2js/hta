import { useStore } from "../../hook";

export default function () {
  const name = useStore((state) => state.location.state);
  return `Hello ${name}`;
}
