import { pathToRegexp } from "path-to-regexp";
import { EMPTY_OBJECT } from "../core/types";
import { enqueue1, isArray } from "../core/util";
import { useEffect, useStore } from "../hook";
import { routerProvider } from "./context";
import history from "./history";
import redirectTo from "./redirectTo";
import { saveLocation } from "./saveLocation";
import useMatch from "./useMatch";

let cache = {};

export default function Router(props) {
  let { dispatch } = useStore();
  let location = useStore((state) => state.location);
  useEffect(() => {
    // router already setup, nothing to do
    if (location) return;
    // update current location
    enqueue1(() => dispatch(saveLocation, history.location));
    // handle history changed
    return history.listen((e) => {
      dispatch(saveLocation, e.location);
    });
  });
  // wait for location ready
  if (!location) return;

  let routes =
    props.path === void 0
      ? // multiple routes
        props.routes
      : // single routes
        { [props.path]: props };

  let parentMatch = routes.nested ? useMatch() : undefined;

  let fallback;
  let pathname = location.pathname;
  let matched;
  for (let key in routes) {
    if (key === "nested") continue;
    let route = routes[key];
    if (typeof route === "function" || isArray(route)) {
      route = { render: route };
    }

    if (key === "_") {
      fallback = route;
      continue;
    }

    let { exact = false, strict = false, sensitive = false } = route;
    let paths = (route.paths || []).concat(key);
    if (parentMatch) paths = paths.map((path) => parentMatch.add.path(path));
    for (let i = 0; i < paths.length; i++) {
      let path = paths[i];
      let end = path[path.length - 1] === "$";
      if (end) path = path.substr(0, path.length - 1);
      let { pattern, keys } = getMatcher(path, {
        end: exact || end,
        strict,
        sensitive,
      });
      let result = pattern.exec(pathname);
      if (!result) continue;
      let isExact = pathname === result[0];
      let params = {};
      let k = keys.length;
      while (k--) params[keys[k].name] = result[k + 1];
      let match = createMatch(result[0], path, isExact, params);
      matched = { route, match };
      break;
    }
    if (matched) break;
  }
  let componentProps, renderComponent;
  if (!matched) {
    // nothing to render
    if (!fallback) return;
    if (fallback.to)
      return redirectTo(fallback.to, fallback.state, fallback.replace);
    componentProps = {
      match: createMatch(location.pathname),
      history,
      location,
    };
    renderComponent = fallback.render;
  } else {
    componentProps = {
      match: matched.match,
      history,
      location,
    };
    renderComponent = matched.route.render;
  }
  if (!renderComponent) return;

  return routerProvider(
    { match: componentProps.match },
    Array.isArray(renderComponent)
      ? // render: [component, propsResolver]
        typeof renderComponent[1] === "function"
        ? [renderComponent[0], renderComponent[1](componentProps)]
        : // render: [component, props]
          renderComponent
      : // render: Function
        [renderComponent, componentProps]
  );
}

function createMatch(url, path, isExact, params = EMPTY_OBJECT) {
  return {
    path,
    isExact,
    params,
    url,
    add: {
      path: (subPath) => appendUrl(path, subPath),
      url: (subUrl) => appendUrl(url, subUrl),
    },
  };
}

function appendUrl(url = "", subUrl = "") {
  return (
    url +
    (url[url.length - 1] === "/" ? "" : "/") +
    (subUrl[0] === "/" ? subUrl.substr(1) : subUrl)
  );
}

function getMatcher(path, options) {
  let key = `${options.end}${options.strict}${options.sensitive}`;
  let item = cache[key] || (cache[key] = {});
  let matcher = item[path] || (item[path] = { isNew: true });
  if (matcher.isNew) {
    matcher.isNew = false;
    let keys = [];
    let pattern = pathToRegexp(path, keys, options);
    matcher.keys = keys;
    matcher.pattern = pattern;
  }
  return matcher;
}
