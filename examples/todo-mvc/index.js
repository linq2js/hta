// defining actions
function load() {
  return {
    todos: JSON.parse(localStorage.getItem("todos")) || [],
  };
}

function filterTodos(todos, filter) {
  return filter === "completed"
    ? todos.filter((todo) => todo.completed)
    : filter === "active"
    ? todos.filter((todo) => !todo.completed)
    : todos;
}

function save({ todos }) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function add({ todos }, title) {
  return {
    todos: todos.concat({
      id: Date.now(),
      title,
      completed: false,
    }),
  };
}

function toggle({ todos }, id) {
  return {
    todos: todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  };
}

function remove({ todos }, id) {
  return {
    todos: todos.filter((todo) => todo.id !== id),
  };
}

function removeCompleted({ todos }) {
  return {
    todos: todos.filter((todo) => !todo.completed),
  };
}
