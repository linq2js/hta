import { $, render as originalRender } from "../core";

export { $, originalRender };

export function render(component, options) {
  return originalRender(component, {
    ...options,
    container: "#app",
  });
}

export function query(selector) {
  return document.querySelector(selector);
}

export function queryAll(selector) {
  return [...document.querySelectorAll(selector)];
}

export function tag(strings) {
  return strings;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});
