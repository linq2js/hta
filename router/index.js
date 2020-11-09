import { createBrowserHistory } from "history";
import { pathToRegexp } from "path-to-regexp";
import $, { enqueue1, emptyObject } from "../lib";

let cache = {};
let routerProviderName = "@@router";
export let history = createBrowserHistory();

function saveLocation(state, location) {
  return { location: { ...location, state: location.state || emptyObject } };
}

export default router;

Object.assign(router, {
  link,
  match() {
    return $.consume(routerProviderName).match;
  },
  redirect() {
    return [
      Redirect,
      typeof arguments[0] === "string"
        ? { to: arguments[0], state: arguments[1], replace: arguments[2] }
        : arguments[0],
    ];
  },
});

export function router(routes) {
  if (typeof routes === "string")
    return [
      Router,
      {
        ...(typeof arguments[1] === "function" || Array.isArray(arguments[1])
          ? { render: arguments[1] }
          : arguments[1]),
        path: routes,
      },
    ];
  return [Router, { routes }];
}

export function link(options) {
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
      onclick(_, e) {
        e.preventDefault();
        replace
          ? history.replace(to || node.href, state)
          : history.push(to || node.href, state);
      },
    };
  };
}

function redirect(to, state, replace) {
  if (history.location.pathname === to) return;
  // console.log("redirect", to);
  replace ? history.replace(to, state) : history.push(to, state);
}

export function Redirect({ to, state, replace }) {
  $.effect(() => redirect(to, state, replace));
}

export function Router(props) {
  let { dispatch } = $.store();
  let location = $.store((state) => state.location);
  $.effect(() => {
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
    typeof props.path === "undefined"
      ? // multiple routes
        props.routes
      : // single routes
        { [props.path]: props };

  let parentMatch = routes.nested ? router.match() : undefined;

  let fallback;
  let pathname = location.pathname;
  let matched;
  for (let key in routes) {
    if (key === "nested") continue;
    let route = routes[key];
    if (typeof route === "function" || Array.isArray(route)) {
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
      return redirect(fallback.to, fallback.state, fallback.replace);
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

  return $.provide(
    routerProviderName,
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

function createMatch(url, path, isExact, params = emptyObject) {
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
