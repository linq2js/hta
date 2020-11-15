import { $, render } from "../../core";
import "./styles.css";
import { hookExtras, useStore } from "../../hook";
import { storeExtras } from "../../store";

const startTime = Date.now();
const duration = 30000;
const numElements = 100;
const elements = new Array(numElements).fill(1).map((_, index) => index + 1);

const Cell = ({ n }) => {
  const color = useStore((state) => state.colors[n]);
  return $`<div style="width: 30px; height: 30px; text-align: center; padding: 10px; float: left;" ${{
    style: { backgroundColor: color },
  }}>${n}</div>`;
};

const Matrix = () => {
  return $`<div id="matrix" style="width: 500px">${elements.map((n) => [
    Cell,
    { n },
  ])}</div>`;
};

const Info = () => {
  const { numColorUpdates, startTime } = useStore((state) => ({
    numColorUpdates: state.numColorUpdates,
    startTime: state.startTime,
  }));
  const secondsRunning = (Date.now() - startTime) / 1000;
  const colorsPerSecond = Math.floor(numColorUpdates / secondsRunning);

  return $`
  <h1 style="font-weight: 100">${secondsRunning}</h1>
  <div>${numColorUpdates} colors</div>
  <div>${colorsPerSecond} colors per second</div>
  `;
};

const App = () => {
  return $`
  <div>
    <h1>HTA</h1>
    <div>
      ${Info}
      ${Matrix}
    </div>
  </div>
  `;
};

const app = render(App, {
  state: {
    startTime,
    numColorUpdates: 0,
    colors: {},
  },
  use: [hookExtras, storeExtras],
  container: "#app",
});

function updateColor({ colors }, { n, color }) {
  return {
    colors: {
      ...colors,
      [n]: color,
    },
  };
}

function updateNumColorUpdates(state, value) {
  return {
    numColorUpdates: value,
  };
}

let numColorUpdates = 0;
function setColor(n) {
  const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  app.dispatch(updateColor, { n, color: randomColor });
  numColorUpdates++;
  app.dispatch(updateNumColorUpdates, numColorUpdates);
  if (Date.now() - startTime >= duration) return;
  setTimeout(() => setColor(n), 0);
}

for (let n = 1; n <= numElements; n++) {
  setColor(n);
}
