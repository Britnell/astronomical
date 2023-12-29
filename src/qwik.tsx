/** @jsxImportSource @builder.io/qwik */
import {
  $,
  Slot,
  component$,
  useOn,
  useSignal,
  useStore,
  type QRL,
} from "@builder.io/qwik";

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

export const Tabs = component$(({ tabs }: { tabs: string[] }) => {
  const activeTab = useSignal(0);

  return (
    <>
      <div>
        <h1>Tabs</h1>
        <p>
          I first returned my jsx as I was rendered by a map. with hardcoded
          buttons. After hardcoding the buttons I started behaving well.
        </p>
        <ul class=" flex gap-8">
          <li>
            <button
              class={
                " bg-gray-100  px-3 py-1" +
                (activeTab.value === 0 ? " border-b-2 border-black " : " ")
              }
              onClick$={() => (activeTab.value = 0)}
            >
              Tab One
            </button>
          </li>
          <li>
            <button
              class={
                " bg-gray-100  px-3 py-1" +
                (activeTab.value === 1 ? " border-b-2 border-black " : " ")
              }
              onClick$={() => (activeTab.value = 1)}
            >
              Tab Two
            </button>
          </li>
          <li>
            <button
              class={
                " bg-gray-100  px-3 py-1" +
                (activeTab.value === 2 ? " border-b-2 border-black " : " ")
              }
              onClick$={() => (activeTab.value = 2)}
            >
              Tab Three
            </button>
          </li>
          {/* {tabs.map((tab, t) => (
          <li key={t}>
            <button
              class={
                " bg-gray-100  px-3 py-1" +
                (activeTab.value === t ? " border-b-2 border-black " : " ")
              }
              onClick$={() => (activeTab.value = t)}
            >
              Tab {tab}
            </button>
          </li>
        ))} */}
        </ul>
        <div
          class={
            (activeTab.value === 0 ? " tab0 " : "") +
            (activeTab.value === 1 ? " tab1 " : "") +
            (activeTab.value === 2 ? " tab2 " : "")
          }
        >
          <Slot />
        </div>
      </div>
      <NewTab />
    </>
  );
});

const NewTab = component$(() => {
  return (
    <div>
      <Tabslot
        callback$={$((el: HTMLElement, buttons: HTMLElement[]) => {
          console.log(" tabchange");
          const activeClass = ["border-b-2", "border-black"];
          buttons?.forEach((but) => but.classList.remove(...activeClass));
          el.classList.add(...activeClass);
        })}
      >
        <div q:slot="tabs">
          <ul class=" flex gap-8">
            <li>
              <button data-t={0} class={" bg-gray-100  px-3 py-1"}>
                Tab One
              </button>
            </li>
            <li>
              <button data-t={1} class={" bg-gray-100  px-3 py-1"}>
                Tab Two
              </button>
            </li>
            <li>
              <button data-t={2} class={" bg-gray-100  px-3 py-1"}>
                Tab Three
              </button>
            </li>
          </ul>
        </div>
        <div q:slot="contents">
          <div class="tab">
            <h3>
              Tab One COntents ... Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Eum, error.
            </h3>
          </div>
          <div class="tab">
            <h3>
              Tab Two COntents ... Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Eum, error.
            </h3>
          </div>
          <div class="tab">
            <h3>
              Tab Three COntents ... Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Eum, error.
            </h3>
          </div>
        </div>
      </Tabslot>
    </div>
  );
});

export const Tabslot = component$(({ callback$ }: { callback$: any }) => {
  const activeTab = useSignal(0);
  const ref = useSignal<HTMLDivElement>();

  useOn(
    "click",
    $((ev) => {
      const el = ev.target as HTMLElement;
      if (el?.tagName !== "BUTTON") return;

      const i = parseInt(el.getAttribute("data-t") ?? "");
      if (isNaN(i)) return;
      activeTab.value = i;

      const buttons = ref.value?.querySelectorAll("button");
      callback$(el, buttons);
    })
  );

  return (
    <div>
      <h1 class=" mt-10 text-2xl">Tab #2</h1>
      <p>i use Qwik named slots to provide tabs & contents</p>
      <p>
        {`we have a somewhat reusable component that ships renders fully to html &
        minimal js, though the logic needs to be quite specific to fulfil the "no-jsx" `}
      </p>
      <div ref={ref}>
        <Slot name="tabs" />
      </div>
      <div
        class={
          " max-w-[400px] bg-blue-100 " +
          (activeTab.value === 0 ? " tab0 " : "") +
          (activeTab.value === 1 ? " tab1 " : "") +
          (activeTab.value === 2 ? " tab2 " : "")
        }
      >
        <Slot name="contents" />
      </div>
    </div>
  );
});
