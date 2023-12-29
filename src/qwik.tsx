/** @jsxImportSource @builder.io/qwik */
import { Slot, component$, useSignal, useStore } from "@builder.io/qwik";

export const Counter = component$(() => {
  const count = useSignal(0);

  return (
    <div>
      <h1>Counter = {count.value}</h1>
      <button class=" bg-gray-200 p-2 " onClick$={() => count.value++}>
        +1
      </button>
    </div>
  );
});

export const Menu = component$(() => {
  const expanded = useSignal(false);

  return (
    <div>
      <h1>menu : {expanded.value ? "open" : "closed"}</h1>
      <p>
        The only js loaded here is for setting the signal = !signal, since only
        html attributes and classNames are modified this can be done by signals
        and no jsx is sent to the frontend
      </p>
      <button
        class=" bg-gray-200 p-2 "
        onClick$={() => (expanded.value = !expanded.value)}
        aria-expanded={expanded.value}
        aria-controls="menu"
      >
        MENU
      </button>
      <div id="menu" class={expanded.value ? " block " : " hidden "}>
        <Slot />
      </div>
    </div>
  );
});

export const Todo = component$(({ data }: { data: string[] }) => {
  const store = useStore({
    todos: data.map((d) => ({ done: false, name: d, id: Date.now() })),
  });

  return (
    <div>
      <h2>todos</h2>
      <ul class=" ml-6 ">
        {store.todos.map((todo, t) => (
          <li key={todo.id} class="  list-disc list-item">
            <input
              value={todo.name}
              onInput$={(_, el) => (store.todos[t].name = el.value)}
            />
          </li>
        ))}
      </ul>
      <button
        class=" bg-gray-100 p-1"
        onClick$={() => {
          store.todos = [
            ...store.todos,
            { name: "", done: false, id: Date.now() },
          ];
        }}
      >
        new todo
      </button>

      <p>{JSON.stringify(store.todos, null, 2)}</p>
    </div>
  );
});
