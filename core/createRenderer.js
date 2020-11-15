import { RENDERER } from "./types";

export default function createRenderer(renderer) {
  renderer.type = RENDERER;
  return renderer;
}
