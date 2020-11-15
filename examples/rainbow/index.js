import { $, render } from "../../core";
import { useStore } from "../../hook";
import { storeExtras } from "../../store";

const Controls = () => {
  let { numPoints, async } = useStore((state) => ({
    numPoints: state.numPoints,
    async: state.async,
  }));
  return $`
  <div class="controls">
    # Points
    <input name="numPoints" type="range" min=10 max=10000 ${{
      value: numPoints,
      onchange: [handleUIUpdate],
    }}>
    ${numPoints}
    <label>
      <input name="async" type="checkbox" ${{
        checked: async,
        onchange: [handleUIUpdate],
      }}>
      Async
    </label>
  </div>
  `;
};

const Canvas = () => {
  const points = useStore((state) => state.points);
  return $`
  <svg class="demo">
    <g>${points.map(Point)}</g>
  </svg>
  `;
};

const App = () => $`
<div class="app-wrapper">
  ${Canvas}
  ${Controls}
  <div class="about">
    Demo by <a href="https://twitter.com/WebReflection" target="_blank">Andrea Giammarchi</a>,
    based on the Preact demo by <a href="https://github.com/developit" target="_blank">Jason Miller</a>,
    based on the Glimmer demo by <a href="http://mlange.io" target="_blank">Michael Lange</a>.
  </div>
</div>
`;

render(App, {
  state: {
    numPoints: 0,
    points: [],
    numSteps: 60 * 2,
    step: 0,
    layout: 0,
    async: false,
  },
  use: [storeExtras],
  onLoad(app) {
    setTimeout(() => {
      app.dispatch(update, { key: "numPoints", value: 1000 });
      function animate() {
        app.dispatch(next);
        requestAnimationFrame(animate);
      }
      animate();
    });
  },
});

// components
function Point(point) {
  const props = {
    attr: { fill: point.color, transform: `translate(${point.x}, ${point.y})` },
  };
  return $`<rect class="point" ${props}/>`;
}

//actions
function handleUIUpdate(state, e) {
  return [update, { key: e.target.name, value: parseInt(e.target.value, 10) }];
}

function update(state, { key, value }) {
  return [{ [key]: value }, updatePoints];
}

function updatePoints({ numPoints }) {
  let phyllotaxis = genPhyllotaxis(numPoints);
  let grid = genGrid(numPoints);
  let wave = genWave(numPoints);
  let spiral = genSpiral(numPoints);
  const points = makePoints(numPoints, { phyllotaxis, grid, wave, spiral });
  return { points };
}

// utilities

const Layout = {
  PHYLLOTAXIS: 0,
  GRID: 1,
  WAVE: 2,
  SPIRAL: 3,
};

const LAYOUT_ORDER = [
  Layout.PHYLLOTAXIS,
  Layout.SPIRAL,
  Layout.PHYLLOTAXIS,
  Layout.GRID,
  Layout.WAVE,
];

const theta = Math.PI * (3 - Math.sqrt(5));

function makePoints(numPoints, anchors) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push(
      setAnchors(
        {
          x: 0,
          y: 0,
          color: d3.interpolateViridis(i / numPoints),
        },
        i,
        anchors
      )
    );
  }
  return points;
}

function next({ step, numSteps, layout, points }) {
  step = (step + 1) % numSteps;

  if (step === 0) {
    layout = (layout + 1) % LAYOUT_ORDER.length;
  }

  // Clamp the linear interpolation at 80% for a pause at each finished layout state
  const pct = Math.min(1, step / (numSteps * 0.8));

  const currentLayout = LAYOUT_ORDER[layout];
  const nextLayout = LAYOUT_ORDER[(layout + 1) % LAYOUT_ORDER.length];

  // Keep these redundant computations out of the loop
  const pxProp = xForLayout(currentLayout);
  const nxProp = xForLayout(nextLayout);
  const pyProp = yForLayout(currentLayout);
  const nyProp = yForLayout(nextLayout);

  return {
    step,
    layout,
    points: points.map((point) => ({
      ...point,
      x: lerp(point, pct, pxProp, nxProp) || 0,
      y: lerp(point, pct, pyProp, nyProp) || 0,
    })),
  };
}

function setAnchors(p, index, { grid, wave, spiral, phyllotaxis }) {
  const [gx, gy] = project(grid(index));
  const [wx, wy] = project(wave(index));
  const [sx, sy] = project(spiral(index));
  const [px, py] = project(phyllotaxis(index));
  Object.assign(p, { gx, gy, wx, wy, sx, sy, px, py });
  return p;
}

function xForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return "px";
    case Layout.GRID:
      return "gx";
    case Layout.WAVE:
      return "wx";
    case Layout.SPIRAL:
      return "sx";
  }
}

function yForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return "py";
    case Layout.GRID:
      return "gy";
    case Layout.WAVE:
      return "wy";
    case Layout.SPIRAL:
      return "sy";
  }
}

function lerp(obj, percent, startProp, endProp) {
  let px = obj[startProp];
  return px + (obj[endProp] - px) * percent;
}

function genPhyllotaxis(n) {
  return (i) => {
    let r = Math.sqrt(i / n);
    let th = i * theta;
    return [r * Math.cos(th), r * Math.sin(th)];
  };
}

function genGrid(n) {
  let rowLength = Math.round(Math.sqrt(n));
  return (i) => [
    -0.8 + (1.6 / rowLength) * (i % rowLength),
    -0.8 + (1.6 / rowLength) * Math.floor(i / rowLength),
  ];
}

function genWave(n) {
  let xScale = 2 / (n - 1);
  return (i) => {
    let x = -1 + i * xScale;
    return [x, Math.sin(x * Math.PI * 3) * 0.3];
  };
}

function genSpiral(n) {
  return (i) => {
    let t = Math.sqrt(i / (n - 1)),
      phi = t * Math.PI * 10;
    return [t * Math.cos(phi), t * Math.sin(phi)];
  };
}

function scale(magnitude, vector) {
  return vector.map((p) => p * magnitude);
}

function translate(translation, vector) {
  return vector.map((p, i) => p + translation[i]);
}

function project(vector) {
  const wh = window.innerHeight / 2;
  const ww = window.innerWidth / 2;
  return translate([ww, wh], scale(Math.min(wh, ww), vector));
}

(function () {
  var script = document.createElement("script");
  script.onload = function () {
    var stats = new Stats();
    document.body.appendChild(stats.dom);
    requestAnimationFrame(function loop() {
      stats.update();
      requestAnimationFrame(loop);
    });
  };
  script.src = "//cdn.jsdelivr.net/gh/Kevnz/stats.js/build/stats.min.js";
  document.head.appendChild(script);
})();
