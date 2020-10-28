# HTA

The 2kB framework for building Hyper Text Application

## Why HTA ?

- Write less do more
- No compiler or bundler needed
- Easy to convert HTML template to HTA

## Counter App

Creating Counter App with only 5 lines of code

```js
import hta from "hta";

const Increase = ({ count }) => ({ count: count + 1 });
const App = ({ count }) =>
  hta`<h1>${count}</h1><button ${{ $click: Increase }}>Increase</button>`;
hta(App, { state: { count: 1 } });
```

Let's explain above example line by line

```js
const Increase = ({ count }) => ({ count: count + 1 });
```

In this line, we define Increase action, the first action argument is app state.
The action returns new updates of the app state.

The App component is pure function, it returns HTA template. HTA template is a Tagged Template.
It presents what need to be rendered and contains many placeholders for displaying updatable values.

```js
const App = ({ count }) =>
  hta`<h1>${count}</h1><button ${{ $click: Increase }}>Increase</button>`;
```

There are 2 kinds of binding in the template string above.
The first one is value binding, this binding will render given value at specified position.
The value binding can be placed only inside HTML element contents (not in open/close tag)

```js
// invalid
hta`<div ${value}></div>`;

// valid
hta`<div>${value}</div>`;
```

The second binding is element property binding, the binding must be placed inside element's open tag.
It will update specified attributes/properties/class/style/event of container element.

```
{ $click: Increase }
```

Using property name that starts with \$ mark for adding element event binding.
An Increase action receives the following 2 parameters: a current application state and HTML Event object.

```js
function Increase(state, event) {
  return nextState;
}
```

## Benchmark

1. [HTA](https://codesandbox.io/s/hta-benchmark-6tjge?file=/src/index.js)
1. [React + Redux](https://codesandbox.io/s/hardcore-glade-ts4q7)

## API References

- [hta(component, options)](#)
- [hta\`template string`](#)
- [Application object](#)
  - [app.dispatch(action, payload)](#)
  - [app.getState()](#)
  - [app.state](#)
  - [app.subscribe(listener)](#)
- [Component](#)
  - [Global state](#)
  - [Local state](#)
- [Template bindings](#)
  - [Element property binding](#)
    - [id](#)
    - [name](#)
    - [for](#)
    - [title](#)
    - [href](#)
    - [value](#)
    - [selected](#)
    - [multiple](#)
    - [checked](#)
    - [disabled](#)
    - [class](#)
    - [style](#)
    - [text](#)
    - [html](#)
    - [each](#)
    - [key](#)
    - [item](#)
    - [init](#)
  - [Value binding](#)
  - [Component binding](#)
    - [Rendering component without props](#)
    - [Rendering component with specified props](#)
  - [Conditional binding](#)
