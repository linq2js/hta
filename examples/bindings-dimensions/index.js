import $ from "../../lib";

const App = () => {
  const clientWidth = $.bind();
  const clientHeight = $.bind();
  const selectionStart = $.bind();
  const selectionEnd = $.bind();
  const [text, setText] = $.state("Edit me");
  const [size, setSize] = $.state(42);

  function handleSizeChange(_, e) {
    setSize(e.target.value);
  }

  function handleTextChange(_, e) {
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

$.render(App, { container: "#app" });
