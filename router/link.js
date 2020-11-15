import history from "./history";

export default function link(options) {
  // <a ${link}></a>
  if (options && typeof options.tagName !== "undefined") {
    return link()(options);
  }
  // <a ${link(to)}></a>
  if (typeof options === "string")
    options = { to: options, state: arguments[1] };
  // <a ${link(options)}></a>
  let { to, state, replace } = options || {};
  return function (node) {
    if (to && node.tagName === "A" && node.href !== to) node.href = to;
    return {
      onclick(e) {
        e.preventDefault();
        replace
          ? history.replace(to || node.href, state)
          : history.push(to || node.href, state);
      },
    };
  };
}
