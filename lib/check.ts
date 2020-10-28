import hta from "./index";

const add = ({ todos }, title) => ({
  todos: todos.concat({ id: Math.random(), title, completed: false }),
});

const remove = ({ todos }, id) => ({
  todos: todos.filter((todo) => todo.id !== id),
});

const toggle = ({ todos }, id) => ({
  todos: todos.map((todo) =>
    todos.id === id ? { ...todo, completed: !todo.completed } : todo
  ),
});

const handleKeyPress = (state, e) => {
  if (e.target.key !== "Enter") return;
  return [add, e.target.title];
};

const TodoInput = () =>
  hta`
  <div>
    <input type="text" ${{ $keypress: handleKeyPress }}/>
  </div>
  `;

const TodoList = (props, select) => {
  const todos = select((state) => state.todos);
  return hta`<ul ${{ each: todos, item: (todo) => [TodoItem, todo] }}></ul>`;
};

const TodoItem = ({ id, title, completed }) =>
  hta`
  <li>
    <input type="checkbox" ${{ checked: completed }}/>
    <span ${{ text: title }}></span>
    <button ${{ $click: [remove, id] }}>Remove</button>
  </li>`;

const App = () => hta`
    <h1>Todo App</h1>
    ${TodoInput}
    ${TodoList}
`;

hta(App, {
  state: {
    todos: [
      { id: 1, title: "item 1", completed: false },
      { id: 2, title: "item 2", completed: true },
    ],
  },
});
