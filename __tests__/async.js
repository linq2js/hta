import { asyncExtras, suspense, valueOf } from "../async";
import delay from "../async/delay";
import { $ } from "../core";
import { useStore } from "../hook";
import { storeExtras } from "../store";
import { query, render } from "../test/util";

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
