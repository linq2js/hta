import { $, render } from "../../core";
import { hookExtras, useStore } from "../../hook";
import { storeExtras } from "../../store";

const Button = ({ id, action, title }) => $`
  <div>
    <button type="button" class="btn btn-primary btn-block" ${{
      id,
      title,
      onclick: [action],
    }}>${title}</button>
  </div>
`;

const Row = ({ item }) => {
  const selected = useStore((x) => x.selected === item.id);
  return $`
  <tr ${{ style: selected && "font-weight: bold;" }}>
    <td class="td-id col-md-1">${item.id}</td>
      <td class="col-md-4">
        <a class="select" ${{ onclick: [select, item] }}>${item.label}</a>
      </td>
      <td class="col-md-1">
        <button class="remove" ${{ onclick: [remove, item] }}>remove</button>
      </td>
      <td class="col-md-6"></td>
  </tr>
  `;
};

const Table = () => {
  const data = useStore((state) => state.data);
  return $`
  <table class="table table-hover table-striped test-data">
    <tbody id="tbody">
      ${data.map((item) => [Row, { item, key: item.id }])}
    </tbody>
  </table>
  `;
};

const App = () => {
  return $`
  <div>
    <div class="jumbotron">
    <div class="row">
      <div class="col-md-6"><h1>HTA keyed 3</h1></div>
      <div class="col-md-6">
        <div class="row">
          ${[Button, { id: "run", title: "Create 1,000 rows", action: run }]}
          ${[
            Button,
            { id: "runlots", title: "Create 10,000 rows", action: runLots },
          ]}
          ${[Button, { id: "add", title: "Append 1,000 rows", action: add }]}
          ${[
            Button,
            { id: "update", title: "Update every 10th row", action: update },
          ]}
          ${[Button, { id: "clear", title: "Clear", action: clear }]}
          ${[Button, { id: "swaprows", title: "Swap Rows", action: swapRows }]}
        </div>
      </div>
    </div>
  </div>

  ${Table}
  `;
};

render(App, {
  state: { data: [], selected: null },
  use: [storeExtras, hookExtras],
  container: "#app",
});

function performanceTest(name, callback) {
  const start = Date.now();
  const end = () =>
    setTimeout(() => {
      const elapsed = Date.now() - start;
      console.log(name, elapsed);
    });

  if (callback) {
    const result = callback();
    end();
    return result;
  }
  return end;
}

function run() {
  return performanceTest("run", () => {
    return {
      data: buildData(1000),
      selected: 0,
    };
  });
}

function runLots(state) {
  return performanceTest("runLots", () => {
    return {
      data: buildData(10000),
      selected: 0,
    };
  });
}

function add({ data }) {
  return performanceTest("add", () => ({ data: data.concat(buildData(1000)) }));
}

function update({ data }) {
  return performanceTest("update", () => ({
    data: data.map((item, i) =>
      i % 10 === 0 ? { ...item, label: item.label + "!!!" } : item
    ),
  }));
}

function select({ selected }, item) {
  return {
    selected: item.id,
  };
}

function remove({ data }, item) {
  return performanceTest("remove", () => {
    return {
      data: data.filter((x) => x !== item),
    };
  });
}

function clear(state) {
  return performanceTest("clear", () => {
    return {
      data: [],
      selected: 0,
    };
  });
}

function swapRows({ data }) {
  return performanceTest("swap", () => {
    if (data.length > 2) {
      const newData = data.slice();
      let temp = newData[1];
      newData[1] = newData[data.length - 1];
      newData[data.length - 1] = temp;
      return { data: newData };
    }
  });
}

function random(max) {
  return Math.round(Math.random() * 1000) % max;
}

const A = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];
const C = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const N = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

let nextId = 1;

function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }
  return data;
}
