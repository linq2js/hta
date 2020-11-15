import { createUnKeyedTemplate } from "../core/template";
import render from "../core/render";

let $ = function () {
  return createUnKeyedTemplate.apply(null, arguments);
};

Object.assign($, { render });

export default $;
