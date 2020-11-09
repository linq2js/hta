# HTA

The tiny framework for building Hyper Text Application with ease

## Why HTA ?

- Write less do more
- No compiler or bundler needed
- Easy to convert HTML template to HTA
- Extremely fast DOM updating
- Built-in store and router

## Installation

```
npm install hta --save
```

## Comparison with Other Frameworks

### Syntax

Let's create simple counter app

### HTA

```js
import $ from "hta";

const initialState = { count: 0 };
const Increase = ({ count }) => ({ count: count + 1 });
const CounterValue = () => $`<h1>${$.store("counter")}</h1>`;
const CounterAction = () =>
  $`<button ${{ onclick: Increase }}>Increase</button>`;
const App = () => $`
  ${CounterValue}
  ${CounterAction}`;
$.render(App, { state: initialState });
```

### React + Redux Toolkit

```jsx
import React from "react";
import { render } from "react-dom";
import { connect, Provider } from "react-redux";
import { configureStore, createAction, createReducer } from "@reduxjs/toolkit";

const increment = createAction("INCREMENT");
const reducer = createReducer(0, {
  [increment.type]: (state) => state + 1,
});
const store = configureStore({ reducer });

const CounterValue = connect((state) => ({ count: state }))(({ count }) => (
  <h1>{count}</h1>
));
const CounterAction = connect(null, { increment })(({ increment }) => (
  <button onClick={increment}>Increase</button>
));
const App = () => (
  <>
    <Provider store={store}>
      <CounterValue />
      <CounterAction />
    </Provider>
  </>
);
render(<App />, document.body);
```

## Features

| Feature            |   HTA   |  React  |   Vue   | Angular |
| :----------------- | :-----: | :-----: | :-----: | :-----: |
| Declarative        | &#9745; | &#9745; |         |         |
| Compiler / Bundler |         | &#9745; | &#9745; | &#9745; |
| Component          | &#9745; | &#9745; | &#9745; | &#9745; |
| Hooks              | &#9745; | &#9745; | &#9745; |         |
| Lazy Component     | &#9745; | &#9745; | &#9745; | &#9745; |
| Shared Context     | &#9745; | &#9745; | &#9745; | &#9745; |
| Suspense           | &#9745; |         |         |         |
| Two Way Binding    | &#9745; |         | &#9745; | &#9745; |
| SVG Supported      | &#9745; |         | &#9745; | &#9745; |
| Directive          | &#9745; |         | &#9745; | &#9745; |
| Built-in Router    | &#9745; |         |         | &#9745; |
| Built-in Store     | &#9745; |         |         |         |

## Examples

- [Todo App (4000 todos)](https://codesandbox.io/s/hta-todo-performance-forked-1xmx5?file=/src/index.js)
- [Crypto Search (2000 coins)](https://codesandbox.io/s/hta-crypto-search-rv39j?file=/src/hta/index.js)
- [Silky Smooth (Fast enough to render over 500 elements at 60fps)](https://codesandbox.io/s/hta-silky-smooth-2-s3l3r?file=/src/index.js)
- Performance testing
  - [hta](https://codesandbox.io/s/hta-v1-performance-b3dou?file=/src/index.js)
  - [react + redux](https://codesandbox.io/s/redux-performance-hbit7)
- SVG Animation
  - [hta](https://codesandbox.io/s/hta-v1-balls-anim-90v1j?file=/src/index.js)
  - [d3js](http://tommykrueger.com/projects/d3tests/performance-test.php)

## API references
