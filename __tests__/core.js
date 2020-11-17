import { asyncExtras, suspense, valueOf } from "../async";
import createContext from "../context";
import { parseTemplate } from "../core/template";
import { $, render as originalRender } from "../core";
import { hookExtras, useEffect, useState, useStore } from "../hook";
import { storeExtras } from "../store";

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

function delay(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function render(component, options) {
  return originalRender(component, {
    ...options,
    container: "#app",
  });
}

function query(selector) {
  return document.querySelector(selector);
}

function queryAll(selector) {
  return [...document.querySelectorAll(selector)];
}

function tag(strings) {
  return strings;
}

test("parse no substitution HTML", () => {
  const { html } = parseTemplate(tag`<a></a>`);
  expect(html).toBe("<a></a>");
});
//
// test("not well formed HTML", () => {
//   expect(() => parseTemplate(tag`<a><${false}/a>`)).toThrowError();
// });

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

test("useState", async () => {
  const rerender = jest.fn();
  const Counter = () => {
    const [count1, setCount1] = useState(1);
    const [count2, setCount2] = useState(2);
    rerender();
    return $`<h1>${count1} ${count2}</h1><button ${{
      onclick: () => {
        setCount1(count1 + 1);
        setCount2(count2 + 1);
      },
    }}></button>`;
  };
  render(() => Counter, { use: hookExtras });
  expect(query("h1").innerHTML).toBe("1 2");
  expect(rerender).toBeCalledTimes(1);
  query("button").click();
  await delay();
  expect(query("h1").innerHTML).toBe("2 3");
  expect(rerender).toBeCalledTimes(2);
});

test("conditional rendering", () => {
  const toggle = ({ flag }) => ({ flag: !flag });
  const Odd = () => "odd";
  const Even = () => "even";
  const Upper = ({ text = "nothing" }) => text.toUpperCase();
  const Text1 = () => Upper;
  const app = render(
    ({ flag }) => $`
    <span ${flag ? { id: "id1" } : { id: "id2" }}></span>
    <button>${flag ? "true" : "false"}</button>
    <p>${flag ? Odd : Even}</p>
    <i>${Text1}</i>
  `,
    { state: { flag: true } }
  );
  expect(query("i").innerHTML).toBe("NOTHING");
  expect(query("span").id).toBe("id1");
  expect(query("button").innerHTML).toBe("true");
  expect(query("p").innerHTML).toBe("odd");
  app.dispatch(toggle);
  expect(query("span").id).toBe("id2");
  expect(query("button").innerHTML).toBe("false");
  expect(query("p").innerHTML).toBe("even");
});

test("counter", () => {
  const Increase = ({ count }) => ({ count: count + 1 });
  const CountValue = () => $`<h1>${useStore((state) => state.count)}</h1>`;
  const CountAction = () =>
    $`<button ${{
      onclick: [Increase],
    }}>Increase</button>`;
  render(() => $`${CountValue}${CountAction}`, {
    state: {
      count: 100,
    },
  });

  expect(query("h1").innerHTML).toBe("100");
  query("button").click();
  query("button").click();
  expect(query("h1").innerHTML).toBe("102");
});

test("suspense", async () => {
  const AsyncValue = () =>
    $`<h1>${useStore((state) => valueOf(state.asyncValue))}</h1>`;
  render(() => $`${suspense($`<span>Loading</span>`, AsyncValue)}`, {
    state: { asyncValue: delay(10, 1) },
    use: [asyncExtras, storeExtras],
  });
  expect(query("span")).not.toBeNull();
  await delay(15);
  expect(query("span")).toBeNull();
  expect(query("h1").innerHTML).toBe("1");
});

test("dispatch multiple actions", async () => {
  const action1 = jest.fn();
  const action2 = jest.fn();
  const click1 = () => [[action1], [action2]];
  const click2 = () => [{ done: true }, [action1], [action2]];
  const click3 = () => [[action1], false, [action2]];
  const app = render(
    () => $`
    <button id="b1" ${{ onclick: [click1] }}></button>
    <button id="b2" ${{ onclick: [click2] }}></button>
    <button id="b3" ${{ onclick: [click3] }}></button>`,
    {
      state: {
        done: false,
      },
      use: storeExtras,
    }
  );

  query("#b1").click();
  expect(action1).toBeCalledTimes(1);
  expect(action2).toBeCalledTimes(1);
  expect(app.state).toEqual({ done: false });

  query("#b2").click();
  expect(action1).toBeCalledTimes(2);
  expect(action2).toBeCalledTimes(2);
  expect(app.state).toEqual({ done: true });
});

test("mount/unmount", () => {
  const mount = jest.fn();
  const unmount = jest.fn();

  const Test = () => {
    useEffect(() => {
      mount();
      return unmount;
    });

    return $`<span></span>`;
  };

  const Toggle = ({ flag }) => ({ flag: !flag });

  const app = render(({ flag }) => (flag ? Test : null), {
    state: { flag: true },
    use: hookExtras,
  });

  expect(query("span")).not.toBeNull();
  expect(mount).toBeCalledTimes(1);
  app.dispatch(Toggle);
  expect(query("span")).toBeNull();
  expect(unmount).toBeCalledTimes(1);
});

test("consume custom context", () => {
  let [provide, consume] = createContext();
  const Counter = () => {
    const id = consume();
    return $`<button ${{ id }}></button>`;
  };

  render(() => $`${provide("b1", Counter)}`);

  expect(query("#b1")).not.toBeNull();
});

test("selector", () => {
  const app = originalRender(null, {
    state: { count: 1 },
    use: storeExtras,
    selectors: {
      double: ["count", (count) => count * 2],
      quad: ["double", (double) => double * 2],
    },
  });

  expect(app.state.count).toBe(1);
  expect(app.state.double()).toBe(2);
  expect(app.state.quad()).toBe(4);
});

test("counter using local state", () => {
  render((store, { setState, getState }) => {
    const { count } = getState(() => ({ count: 5 }));
    return $`<h1 ${{
      onclick: () => setState({ count: count + 1 }),
    }}>${count}</h1>`;
  });
  expect(query("h1").innerHTML).toBe("5");
  query("h1").click();
  query("h1").click();
  expect(query("h1").innerHTML).toBe("7");
});
