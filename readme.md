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
import { $, render } from "hta";

const initialState = { count: 0 };
const Increase = ({ count }) => ({ count: count + 1 });
const CounterValue = (props, select) => $`<h1>${select("count")}</h1>`;
const CounterAction = () =>
  $`<button ${{ onclick: [Increase] }}>Increase</button>`;
const App = () => $`
  ${CounterValue}
  ${CounterAction}`;
render(App, { state: initialState });
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

| Feature                   |   HTA   |  React  |   Vue   | Angular |
| :------------------------ | :-----: | :-----: | :-----: | :-----: |
| Compiler / Bundler needed |         | &#9745; | &#9745; | &#9745; |
| Async Rendering           | &#9745; |         |         |         |
| Two Way Binding           | &#9745; |         | &#9745; | &#9745; |
| SVG Supported             | &#9745; |         | &#9745; | &#9745; |
| Directive                 | &#9745; |         | &#9745; | &#9745; |
| Built-in Router           | &#9745; |         |         | &#9745; |
| Built-in Store            | &#9745; |         |         |         |
| Suspense                  | &#9745; | &#9745; |         |         |
| Declarative               | &#9745; | &#9745; |         |         |
| Component                 | &#9745; | &#9745; | &#9745; | &#9745; |
| Hooks                     | &#9745; | &#9745; | &#9745; |         |
| Lazy Component            | &#9745; | &#9745; | &#9745; | &#9745; |
| Shared Context            | &#9745; | &#9745; | &#9745; | &#9745; |

## Basic Usages

### Render simple HTML

```js
import { $, render } from "hta";
render($`<h1>Hello World</h1>`);
```

### Using substitutions

```js
import { $, render } from "hta";
render($`<h1>It is ${new Date().toLocaleTimeString()}.</h1>`);
```

If the substitution is:

- **string/number/Date**: It will be rendered as text node
- **boolean/undefined/null**: It will not be rendered
- **Function**: HTA understands the function is component and render the component content/result
- **Tuple \[Function, object\]**: HTA renders component with specified props (the second item of tuple)
- Promise/Plain object: By default HTA renders these text node, and the node value is toString() result,
  but you can add extras (please refer JSON tag extras) to handle plain object rendering.

### Using element binding

```js
import { $, render } from "hta";
render(
  // add style attribute and textContent property bindings to DIV element
  $`<div ${{ style: "font-weight: bold", textContent: "Hello World" }}></div>`
);
```

The binding must be placed in open tag. You can bind any element property / attribute.

## Advanced Usages

## Examples

- [Todo MVC(140 lines of code)](https://codesandbox.io/s/hta-todomvc-76dib?file=/src/index.js)
- [Todo App (4000 todos)](https://codesandbox.io/s/hta-todo-performance-forked-1xmx5?file=/src/index.js)
- [Crypto Search (700 coins)](https://codesandbox.io/s/hta-crypto-search-rv39j?file=/src/hta/index.js)
- [Silky Smooth (Fast enough to render over 500 elements at 60fps)](https://codesandbox.io/s/hta-silky-smooth-2-s3l3r?file=/src/index.js)
- Performance testing
  - [hta](https://codesandbox.io/s/hta-v1-performance-b3dou?file=/src/index.js)
  - [react + redux](https://codesandbox.io/s/redux-performance-hbit7)
- SVG Animation
  - [hta](https://codesandbox.io/s/hta-v1-balls-anim-90v1j?file=/src/index.js)
  - [d3js](http://tommykrueger.com/projects/d3tests/performance-test.php)

## API references
