import createContext from "../context";
import { createKeyedTemplate, createUnKeyedTemplate } from "../core/template";
import { DOC, EMPTY_OBJECT, FUNC } from "../core/types";
import { slice } from "../core/util";
import { compile, serialize, stringify } from "stylis";

let styleElement;
let defaultTheme = {};
let [provideTheme, consumeTheme] = createContext(defaultTheme);
let uuid = Date.now();
let cache = new Map();

export { provideTheme };

export function useTheme() {
  return consumeTheme();
}

export function styled(defaultTag, binding) {
  let hasBinding = arguments.length > 1;
  return function (strings) {
    let substitutions = slice.call(arguments, 1);

    function getClass(tag, props) {
      let theme = consumeTheme();
      let wrappedProps = { theme, ...props };
      let style = substitutions
        .reduce(
          (arr, value, index) => {
            arr.push(
              typeof value === FUNC ? value(wrappedProps) : value,
              strings[index + 1]
            );
            return arr;
          },
          [strings[0]]
        )
        .join("");
      let klass = cache.get(style);
      if (!klass) cache.set(style, (klass = addStyle(style)));
      return { class: klass, props: wrappedProps };
    }

    function render(tag, props = EMPTY_OBJECT) {
      let result = getClass(tag, props);
      result.props.class = result.class;
      if (typeof tag === FUNC) return tag(result.props);
      result.props.inner = null;
      let templateFactory =
        "key" in result.props
          ? createKeyedTemplate(result.props.key)
          : createUnKeyedTemplate;
      if (!hasBinding) {
        return templateFactory([`<${tag} `, `/>`], {
          class: result.class,
          ...props,
        });
      }

      let wrappedBinding = {
        class: result.class,
        ...(typeof binding === FUNC ? binding(result.props) : binding),
      };
      return "inner" in props
        ? templateFactory(
            [`<${tag} `, ">", `</${tag}>`],
            wrappedBinding,
            props.inner
          )
        : templateFactory([`<${tag} `, `/>`], wrappedBinding);
    }

    return Object.assign(
      function (props) {
        return render(defaultTag, props);
      },
      {
        as(tag) {
          return function (props) {
            return render(tag, props);
          };
        },
        toString() {
          return getClass(defaultTag, EMPTY_OBJECT);
        },
      }
    );
  };
}

function addStyle(style) {
  if (!styleElement) {
    styleElement = DOC.createElement("style");
    (DOC.querySelector("head") || DOC.body).appendChild(styleElement);
  }
  let className = "_" + (uuid++).toString(16);
  let serializedStyle = serialize(compile(`.${className}{${style}`), stringify);
  styleElement.appendChild(document.createTextNode(serializedStyle));
  return className;
}
