import { FUNC } from "../core/types";
import { useRouter } from "./context";
import Redirect from "./Redirect";
import Router from "./Router";
export { default as link } from "./link";
export { default as history } from "./history";
export { default as useMatch } from "./useMatch";
export { useRouter, Redirect, Router };

export function redirect() {
  return [
    Redirect,
    typeof arguments[0] === "string"
      ? { to: arguments[0], state: arguments[1], replace: arguments[2] }
      : arguments[0],
  ];
}

export function router(routes) {
  if (typeof routes === "string")
    return [
      Router,
      {
        ...(typeof arguments[1] === FUNC || Array.isArray(arguments[1])
          ? { render: arguments[1] }
          : arguments[1]),
        path: routes,
      },
    ];
  return [Router, { routes }];
}
