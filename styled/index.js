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

function generateClass(props, strings, substitutions, overrideTheme) {
  let theme = overrideTheme || consumeTheme();
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

function applyDocumentStyle(strings) {
  let substitutions = slice.call(arguments, 1);
  let result = generateClass(
    EMPTY_OBJECT,
    strings,
    substitutions,
    defaultTheme
  );
  document.documentElement.classList.toggle(result.class, true);
}

export function styled(defaultTag, binding) {
  if (Array.isArray(defaultTag)) {
    return applyDocumentStyle.apply(null, arguments);
  }
  let hasBinding = arguments.length > 1;
  let defaultGeneratedClass;
  return function (strings) {
    let substitutions = slice.call(arguments, 1);

    function render(tag, props = EMPTY_OBJECT) {
      let result = generateClass(props, strings, substitutions);
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
          if (!defaultGeneratedClass) {
            defaultGeneratedClass = generateClass(
              EMPTY_OBJECT,
              strings,
              substitutions
            ).class;
          }
          return defaultGeneratedClass;
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
