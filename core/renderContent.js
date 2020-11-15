import isPromiseLike from "./isPromiseLike";
import renderComponent from "./renderComponent";
import renderList from "./renderList";
import renderTemplate from "./renderTemplate";
import renderText from "./renderText";
import { DATE, FUNC, REGEX, SCOPE, TEMPLATE } from "./types";
import { isArray } from "./util";

export default function renderContent(
  app,
  context,
  parent,
  key,
  marker,
  content
) {
  if (content && content.type === TEMPLATE)
    return renderTemplate(
      renderContent,
      app,
      context,
      parent,
      key,
      marker,
      content
    );
  // render component without props
  if (typeof content === FUNC) {
    return renderComponent(
      renderContent,
      app,
      context,
      parent,
      key,
      marker,
      content
    );
  }
  if (isArray(content)) {
    if (typeof content[0] === FUNC)
      return renderComponent(
        renderContent,
        app,
        context,
        parent,
        key,
        marker,
        content[0],
        content[1],
        content.length > 2 && content.slice(1)
      );
    // value formatter
    if (typeof content[1] === FUNC) {
      let select = SCOPE.current.component.select;
      let formattedContent = content
        .slice(1)
        .reduce(
          (value, formatter) => formatter(value, select, app),
          content[0]
        );
      return renderText(app, context, parent, key, marker, formattedContent);
    }
    return renderList(
      renderContent,
      app,
      context,
      parent,
      key,
      marker,
      content
    );
  }
  if (
    app.extras.render.object &&
    content &&
    typeof content === "object" &&
    context.constructor !== DATE &&
    context.constructor !== REGEX &&
    !isPromiseLike(content)
  ) {
    return app.extras.render.object({
      render: renderContent,
      app,
      context,
      parent,
      key,
      marker,
      content,
    });
  }
  return renderText(app, context, parent, key, marker, content);
}
