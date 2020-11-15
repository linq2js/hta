import { useEffect } from "../hook";
import redirectTo from "./redirectTo";

export default function Redirect({ to, state, replace }) {
  useEffect(() => redirectTo(to, state, replace));
}
