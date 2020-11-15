import { $, render } from "../../core";
import { asyncExtras, suspense, valueOf } from "../../async";
import { hookExtras, useStore } from "../../hook";
import { storeExtras } from "../../store";

const maxCoins = 700;
const searchDebounce = 200;

const Text = ({ text, term }) => {
  if (!term) return text;
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return text;
  const before = text.substr(0, index);
  const middle = text.substr(index, term.length);
  const after = text.substr(index + term.length);
  return $`${before}<span style="color: red">${middle}</span>${after}`;
};

const Row = ({ term, coin }) => $`
  <tr>
    <td>${[Text, { term, text: coin.Id }]}</td>
    <td>${[Text, { term, text: coin.Symbol }]}</td>
    <td>${[Text, { term, text: coin.FullName }]}</td>
    <td>${coin.TotalCoinsMined}</td>
    <td><img style="width: 30px" ${{
      src: `https://cryptocompare.com${coin.ImageUrl || ''}`,
    }}/></td>
  </tr>
`;

const Header = ({ width, column, orderBy, desc }) =>
  $`
  <th ${{ style: `width: ${width}px` }}>
    <a href="#" ${{
      onclick: [Sort, (e) => [e, column]],
      style: { fontWeight: orderBy === column ? "bold" : "normal" },
    }}>${orderBy === column ? `${column} ${desc ? "⬇️" : "⬆️"}` : column}</a>
  </th>`;

const Table = (props, select) => {
  // select coins from app state
  const { coins, orderBy, desc, term } = useStore((state) => {
    // using valueOf to get value of loadable object
    return {
      coins: valueOf(state.coins),
      orderBy: state.orderBy,
      desc: state.desc,
      term: String(state.filter || "").toLowerCase(),
    };
  });

  return $`
  <div class="form-group">
    <input type="email"
      class="form-control"
      placeholder="Search coin (The coin table will update after 300ms)" ${{
        oninput: {
          action: Search,
          debounce: searchDebounce,
        },
      }}/>
  </div>
  <small style="margin-left: 10px;" class="form-text text-muted">${`${coins.length} coins found`}</small>
  <table class="table table-striped table-bordered table-sm">
    <thead>
      <tr>
      ${[Header, { column: "Id", orderBy, desc, width: 80 }]}
      ${[Header, { column: "Symbol", orderBy, desc, width: 100 }]}
      ${[Header, { column: "FullName", orderBy, desc }]}
      ${[Header, { column: "TotalCoinsMined", orderBy, desc, width: 180 }]}
      ${[Header, { column: "Image", orderBy, desc, width: 100 }]}
      </tr>
    </thead>
    <tbody>
      ${coins.map((coin) => [Row, { coin, term, key: coin.id }])}
    </tbody>
  </table>
`;
};

const App = () => {
  return suspense("Loading...", Table);
};

render(App, {
  state: {
    // load coins from API
    // when coins is loading, App component will render "Loading..."" text
    coins: fetch("https://min-api.cryptocompare.com/data/all/coinlist", {
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) =>
        Object.entries(data.Data)
          .slice(0, maxCoins)
          .map(([Symbol, coin]) => ({
            ...coin,
            FullName: coin.FullName.trim(),
            Symbol,
          }))
      ),
    orderBy: undefined,
  },
  use: [storeExtras, hookExtras, asyncExtras],
});

// define actions

function Search(state, e) {
  return [{ filter: e.target.value }, UpdateCoins];
}

function UpdateCoins({ coins, originalCoins, orderBy, desc, filter }) {
  const source = originalCoins || coins;

  return {
    originalCoins: originalCoins || coins,
    coins: source.map((coins) => {
      if (filter) {
        const term = filter.toLowerCase();
        coins = coins.filter(
          (coin) =>
            coin.Id.toLowerCase().includes(term) ||
            coin.Symbol.toLowerCase().includes(term) ||
            coin.FullName.toLowerCase().includes(term)
        );
      } else {
        coins = coins.slice();
      }
      const step = desc ? -1 : 1;
      return coins.sort((a, b) => {
        const av = a[orderBy] || 0;
        const bv = b[orderBy] || 0;
        if (av > bv) return 1 * step;
        if (av < bv) return -1 * step;
        return 0;
      });
    }),
  };
}

function Sort({ orderBy, desc }, [event, payload]) {
  // cancel A element behavior
  event.preventDefault();
  // invert sort direction if user click on the same column
  if (orderBy === payload) {
    desc = !desc;
  } else {
    desc = false;
    orderBy = payload;
  }

  // update state and dispatch UpdateCoins action
  return [
    {
      orderBy,
      desc,
    },
    UpdateCoins,
  ];
}
