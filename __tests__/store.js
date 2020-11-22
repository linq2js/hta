import { storeExtras } from "../store";
import { $, originalRender, query, render } from "../test/util";

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
