# HTA

The 2kB framework for building Hyper Text Application

## Why HTA ?

- Write less do more
- No compiler or bundler needed
- Easy to convert HTML template to HTA
- Extremely fast DOM updating
- On-premise state management

## Installation

```
npm install hta --save
```

## Counter App

Creating Counter App with few lines of code

```js
import hta from "hta";

// define an Increase action, the action receives current app state and returns state updates
const Increase = ({ count }) =>
  // update count value
  ({ count: count + 1 });
// define App component that receives current app state when it renders
const App = ({ count }) =>
  // the component returns HTA template. We use tagged template to create HTML elements
  // using binding syntax for adding binding to specified element ( ${ binding } )
  // the binding must be placed inside element's open tag
  hta`
    <h1 ${{ text: count }}></h1>
    <button ${{
      // bind Increase action to click event
      $click: Increase,
    }}>Increase</button>`;
// start App rendering with initial state
// the App will be rendered into document.body by default
hta(App, { state: { count: 1 } });
```
