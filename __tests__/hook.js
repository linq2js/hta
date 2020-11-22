import { hookExtras, useEffect, useState } from "../hook";
import useImperativeHandle from "../hook/useImperativeHandle";
import { query, render, $ } from "../test/util";
import delay from "../async/delay";

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
  expect(rerender).toBeCalledTimes(3);
});

test("useImperativeHandle", async () => {
  const callback = jest.fn();
  const trigger = jest.fn();
  let id = 0;
  let ref = {
    get current() {
      return this.__current;
    },
    set current(value) {
      this.__current = value;
      console.log(JSON.stringify(value));
    },
  };

  const Outer = () => {
    const [count, setCount] = useState(1);
    callback(ref.current);
    return $`
      <span ${{
        onclick() {
          ref.current.trigger();
        },
      }}>
        ${[Inner, { ref, count }]}
      </span>
      <strong ${{ onclick: () => setCount(count + 1) }}></strong>
    `;
  };
  const Inner = ({ count }) => {
    useImperativeHandle(
      () => ({
        id: id++,
        value: true,
        trigger,
      }),
      [count]
    );
  };
  render(Outer, { use: hookExtras });
  query("span").click();
  query("span").click();
  expect(trigger).toBeCalledTimes(2);
  expect(ref.current.trigger).toBe(trigger);
  expect(ref.current.id).toBe(0);
  query("strong").click();
  console.log(11)
  expect(ref.current.id).toBe(1);
});
