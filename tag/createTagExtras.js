import createContentWrapper from "../core/createContentWrapper";
import createInstance from "../core/createInstance";
import { createUnKeyedTemplate } from "../core/template";

let templateCache = new Map();

export default function createTagExtras({
  nameProp = "tag",
  childrenProp = "children",
} = {}) {
  return function () {
    return {
      render: {
        object({ app, context, parent, key, marker, content }) {
          let {
            [nameProp]: tag,
            [childrenProp]: children,
            ...binding
          } = content;
          if (!tag) tag = getTagName(marker.parentNode);

          let instance = createInstance(parent, key, tag, null, () => {
            let template = templateCache.get(tag);
            if (!template) {
              template = [`<${tag} `, ">", `</${tag}>`];
              templateCache.set(tag, template);
            }
            return createContentWrapper(marker, {
              template,
            });
          });
          instance.render(
            app,
            context,
            createUnKeyedTemplate(instance.template, binding, children)
          );
        },
      },
    };
  };
}

function getTagName(parentNode) {
  if (!parentNode) return "DIV";
  switch (parentNode.tagName) {
    case "SELECT":
    case "OPTGROUP":
      return "OPTION";
    case "UL":
    case "OL":
      return "LI";
    case "TR":
      return "TD";
    case "TABLE":
    case "TBODY":
    case "THEAD":
      return "TR";
    case "COLGROUP":
      return "COL";
    case "DL":
      return "DT";
    case "A":
    case "P":
    case "BUTTON":
    case "LABEL":
    case "I":
      return "SPAN";
    case "DATALIST":
      return "OPTION";
    case "MAP":
      return "AREA";
    case "NAV":
      return "A";
    case "RUBY":
      return "RT";
    default:
      return "DIV";
  }
}
