import { $, render } from "../../core";
import { storeExtras } from "../../store";

// components
const App = ({ filter, todos, editingId }, { dispatch }) => {
  let activeCount = filterTodos("active", todos).length;
  let visibleTodos = filterTodos(filter, todos);
  let inputRef = {};

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(Add, inputRef.current.value);
    inputRef.current.value = "";
  }

  return $`
  <div>
    <section class="todoapp">
      <header class="header">
        <h1 class="heading">todos</h1>
        <form ${{ onsubmit: handleSubmit }}>
          <input type="text" class="new-todo" placeholder="What needs to be done ?" ${{
            ref: inputRef,
          }}/>
        </form>
      </header>
      <section class="main">
        <input id="toggle-all" class="toggle-all" ${{ onclick: [ToggleAll] }}/>
        <label for="toggle-all"></label>
        <ul class="todo-list">${visibleTodos.map((todo) => [
          Todo,
          { ...todo, key: todo.id, editing: editingId === todo.id },
        ])}</ul>
      </section>
      <footer class="footer">
        <span class="todo-count">
          <strong>${activeCount}</strong> items left
        </span>
        <ul class="filters">
          ${[FilterLink, { text: "All", type: "all", filter }]}
          ${[FilterLink, { text: "Active", type: "active", filter }]}
          ${[FilterLink, { text: "Completed", type: "completed", filter }]}
        </ul>
        <button class="clear-completed" ${{
          onclick: [ClearCompleted],
        }}>Clear Completed</button>
      </footer>
    </section>
    <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="https://github.com/linq2js" target="_blank">Linq2Js</a></p>
        <p>Part of <a href="http://todomvc.com" target="_blank">TodoMVC</a></p>
    </footer>
  </div>
  `;
};

const Todo = ({ id, completed, editing, title }, { dispatch }) => {
  let inputRef = {};
  function handleEdit(e) {
    if (e.key !== "Enter") return;
    dispatch(Update, { id, prop: "title", value: inputRef.current.value });
    dispatch(Edit, null);
  }

  return $`
  <li class="todo" ${{ class: { completed, editing } }}>
    <div class="view">
      <input type="checkbox" class="toggle" ${{
        checked: completed,
        onchange: [Update, { id, prop: "completed", value: !completed }],
      }}/>
      <label ${{ ondblclick: [Edit, id] }}>${title}</label>
      <button class="destroy" ${{ onclick: [Remove, id] }}></button>
    </div>
    <input type="text" class="edit" ${{
      ref: inputRef,
      onkeypress: handleEdit,
      value: title,
    }}/>
  </li>
`;
};

const FilterLink = ({ text, type, filter }) => $`
  <li ${{ onclick: [Filter, type] }}>
    <a href="#" ${{ class: { selected: filter === type } }}>${text}</a>
  </li>`;

// actions
const Load = (state) =>
  JSON.parse(window.localStorage.getItem("appState")) || state;

const Save = (state) => {
  window.localStorage.setItem("appState", JSON.stringify(state));
};

const Filter = (state, filter) => ({ filter });

const Add = ({ todos }, title) => ({
  todos: todos.concat({ id: Date.now(), title, completed: false }),
});

const Update = ({ todos }, { id, prop, value }) => ({
  todos: todos.map((todo) =>
    todo.id === id ? { ...todo, [prop]: value } : todo
  ),
});

const ToggleAll = ({ todos, filter }) => ({
  todos: todos.map((todo) => ({
    ...todo,
    completed: filter === "all" || (filter === "active" && !todo.completed),
  })),
});

const Edit = (state, editingId) => ({ editingId });

const Remove = ({ todos }, id) => ({
  todos: todos.filter((todo) => todo.id !== id),
});

const ClearCompleted = ({ todos }) => ({ todos: filterTodos("active", todos) });

// utils
const filterTodos = (filter, todos) =>
  filter === "active"
    ? todos.filter((todo) => !todo.completed)
    : filter === "completed"
    ? todos.filter((todo) => todo.completed)
    : todos;

render(App, {
  use: storeExtras,
  state: { todos: [], filter: "all", editingId: null },
  onLoad: (app) => app.dispatch(Load),
  onChange: (app) => app.dispatch(Save),
});
