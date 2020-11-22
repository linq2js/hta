import { parseTemplate } from "../core/template";
import { tag } from "../test/util";

test("parse no substitution HTML", () => {
  const { html } = parseTemplate(tag`<a></a>`);
  expect(html).toBe("<a></a>");
});

test("parse HTML contains 1 directive", () => {
  const { html } = parseTemplate(tag`<a ${true}></a>`);
  expect(html).toBe(`<a  hta-0="1" ></a>`);
});

test("parse HTML contains multiple directives", () => {
  const { html } = parseTemplate(
    tag`<a ${true}><span ${true} ${true}></span></a>`
  );
  expect(html).toBe(`<a  hta-0="1" ><span  hta-1="1"   hta-2="1" ></span></a>`);
});

test("parse HTML contains 1 placeholder", () => {
  const { html } = parseTemplate(tag`<a>${true}</a>`);
  expect(html).toBe(`<a><template hta-slot="1" hta-0="1"></template></a>`);
});

test("parse HTML contains multiple placeholders", () => {
  const { html } = parseTemplate(
    tag`${true}<a>${true}<span>before ${true} after</span>${true}</a>`
  );
  expect(html).toBe(
    `<template hta-slot="1" hta-0="1"></template><a><template hta-slot="1" hta-1="1"></template><span>before <template hta-slot="1" hta-2="1"></template> after</span><template hta-slot="1" hta-3="1"></template></a>`
  );
});
