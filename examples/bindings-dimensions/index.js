import { $, render } from "../../core";
import { hookExtras, useBinding, useState } from "../../hook";

const App = () => {
  const clientWidth = useBinding();
  const clientHeight = useBinding();
  const selectionStart = useBinding();
  const selectionEnd = useBinding();
  const [text, setText] = useState("Edit me");
  const [size, setSize] = useState(42);

  function handleSizeChange(e) {
    setSize(e.target.value);
  }

  function handleTextChange(e) {
    setText(e.target.value);
  }

  return $`
  <input type=range ${{ oninput: handleSizeChange, value: size }}/>
  <input ${{
    oninput: handleTextChange,
    value: text,
    selectionStart,
    selectionEnd,
  }}>
  
  <p>
    size: ${clientWidth.value}px x ${clientHeight.value}px.
    selection: ${selectionStart.value}, ${selectionEnd.value}
  </p>
  
  <div ${{ clientWidth, clientHeight }}>
  <span ${{ style: `font-size: ${size}px` }}>${text}</span>
  </div>
  `;
};

render(App, { container: "#app", use: hookExtras });
