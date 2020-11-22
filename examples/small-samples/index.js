import { asyncExtras, delay, until, replace, append } from "../../async";
import { $, render } from "../../core";
import { hookExtras } from "../../hook";
import useMemo from "../../hook/useMemo";
import { styled } from "../../styled";
import { tagExtras } from "../../tag";

document.body.innerHTML = `
    <div id="styled"></div>
    <hr/>
    <div id="clock"></div>
    <hr/>
    <div id="raw-html"></div>
    <hr/>
    <div id="tags"></div>
    <hr/>
    <div id="localize"></div>
    <hr/>
    <div id="counter"></div>
    <hr/>
    <div id="until"></div>
    <hr/>
    <div id="replace"></div>
    <hr/>
    <div id="append"></div>
    
`;

(() => {
  const initialState = { count: 0 };
  const Increase = ({ count }) => ({ count: count + 1 });
  const CounterValue = (props, { select }) => $`<h1>${select("count")}</h1>`;
  const CounterAction = () =>
    $`<button ${{ onclick: [Increase] }}>Increase</button>`;
  const App = () => $`
  ${CounterValue}
  ${CounterAction}`;
  render(App, { state: initialState, container: "#counter" });
})();

(() => {
  const app = render(
    () => $`<h2>It is ${new Date().toLocaleTimeString()}.</h2>`,
    { container: "#clock" }
  );
  setInterval(app.update, 1000);
})();

(() => {
  render(
    $`
    <h1>Raw HTML</h1>
    <div>
        Outer HTML
        ${$`<strong>Inner HTML 1</strong>`}
        ${$("<i>Inner HTML 2</i>")}
    </div>`,
    { container: "#raw-html" }
  );
})();

(() => {
  const app = render(
    () => $`
    <h1>JSON Elements Demo</h1>
    <div>
        container
        ${{ text: "Hello" }}
        ${{ html: "<strong>World</strong>" }}
        ${{
          tag: "ul",
          children: [
            { text: new Date().toTimeString() },
            { text: new Date().toLocaleDateString() },
          ],
        }}
    </div>
  `,
    {
      use: tagExtras,
      container: "#tags",
    }
  );
  setInterval(app.update, 1000);
})();

(() => {
  function Localize(text, select) {
    return select((state) => state[state.lang][text] || text);
  }
  function ToggleVisible(state) {
    return {
      ...state,
      visible: !state.visible,
    };
  }
  function ChangeLanguage(state) {
    return {
      ...state,
      lang: state.lang === "en" ? "es" : "en",
    };
  }
  render(
    ({ visible }) => $`
    <h1>Modifiers Demo</h1>
    <h2>${visible && ["hello", Localize]}</h2>
    <button ${{ onclick: [ChangeLanguage] }}>Change language</button>
    <button ${{ onclick: [ToggleVisible] }}>Toggle visible</button>
  `,
    {
      state: {
        visible: true,
        lang: "en",
        en: {
          hello: "Hello",
        },
        es: {
          hello: "Halo",
        },
      },
      container: "#localize",
    }
  );
})();

(() => {
  const literalPromise = delay(2000, "Done");
  const Increase = ({ count, ...state }) => ({ ...state, count: count + 1 });
  const Toggle = ({ toggle, ...state }) => ({ ...state, toggle: !toggle });
  render(
    ({ toggle, count }) => {
      const dynamicPromise = useMemo(() => delay(2000, count * 2), [count]);
      return $`
    <h1>Until Demo</h1>
    <h2>Literal promise without fallback</h2>
    ${until(literalPromise)}
    <h2>Literal promise with fallback</h2>
    ${until(literalPromise, { fallback: "Loading..." })}
    <h2>Dynamic promise</h2>
    ${until(dynamicPromise, { fallback: "Computing..." })}
    <div><button ${{ onclick: [Increase] }}>Increase</button> ${count}</div>
    <div><button ${{ onclick: [Toggle] }}>Toggle</button> ${toggle}</div>
      `;
    },
    {
      container: "#until",
      state: { count: 1, toggle: false },
      use: [asyncExtras, hookExtras],
    }
  );
})();

(() => {
  const createCountDown = function* (start) {
    while (start >= 0) {
      yield start;
      yield delay(1000);
      start--;
    }
  };
  const literalIterator1 = createCountDown(10);
  const literalIterator2 = createCountDown(10);
  const Increase = ({ count, ...state }) => ({ ...state, count: count + 1 });
  const Toggle = ({ toggle, ...state }) => ({ ...state, toggle: !toggle });
  render(
    ({ toggle, count }) => {
      const dynamicIterator = useMemo(() => createCountDown(count), [count]);
      return $`
    <h1>Replace Demo</h1>
    <h2>Literal iterator without fallback</h2>
    ${replace(literalIterator1)}
    <h2>Literal iterator with fallback</h2>
    ${replace(literalIterator2, { fallback: "Loading..." })}
    <h2>Dynamic promise</h2>
    ${replace(dynamicIterator, { fallback: "Loading..." })}
    <div><button ${{ onclick: [Increase] }}>Increase</button> ${count}</div>
    <div><button ${{ onclick: [Toggle] }}>Toggle</button> ${toggle}</div>
      `;
    },
    {
      container: "#replace",
      state: { count: 1, toggle: false },
      use: [asyncExtras, hookExtras],
    }
  );
})();

(() => {
  const createCountDown = function* (start) {
    while (start >= 0) {
      yield delay(1000);
      yield start;
      start--;
    }
  };
  const literalIterator1 = createCountDown(2);
  const literalIterator2 = createCountDown(2);
  const Increase = ({ count, ...state }) => ({ ...state, count: count + 1 });
  const Toggle = ({ toggle, ...state }) => ({ ...state, toggle: !toggle });
  render(
    ({ toggle, count }) => {
      const dynamicIterator = useMemo(() => createCountDown(count), [count]);
      return $`
    <h1>Append Demo</h1>
    <h2>Literal iterator without fallback</h2>
    ${append(literalIterator1)}
    <h2>Literal iterator with fallback</h2>
    ${append(literalIterator2, { fallback: "Loading..." })}
    <h2>Dynamic iterator</h2>
    ${toggle && append(dynamicIterator, { fallback: "Loading..." })}
    <div><button ${{ onclick: [Increase] }}>Increase</button> ${count}</div>
    <div><button ${{ onclick: [Toggle] }}>Toggle</button> ${toggle}</div>
      `;
    },
    {
      container: "#replace",
      state: { count: 10, toggle: false },
      use: [asyncExtras, hookExtras],
    }
  );
})();

(() => {
  let redHeading = styled("h1")`
    color: ${(props) => props.color};
    font-size: ${(props) => props.size};
  `;

  render(
    () => {
      return $`
      ${Array(1000)
        .fill()
        .map((_, index) =>
          redHeading({
            text: "Heading " + index,
            size: "1em",
            color: "#" + Math.floor(Math.random() * 0xffffff).toString(16),
          })
        )}
    `;
    },
    {
      container: "#styled",
    }
  );
})();
