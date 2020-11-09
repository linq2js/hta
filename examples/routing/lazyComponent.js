import $ from "../../lib";

export default function () {
  const name = $.store((state) => state.location.state);
  return `Hello ${name}`;
}
