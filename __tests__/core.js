import createContext from "../context";
import { useStore } from "../hook";
import { query, render, tag, $ } from "../test/util";

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

test("consume custom context", () => {
  let [provide, consume] = createContext();
  const Counter = () => {
    const id = consume();
    return $`<button ${{ id }}></button>`;
  };

  render(() => $`${provide("b1", Counter)}`);

  expect(query("#b1")).not.toBeNull();
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
