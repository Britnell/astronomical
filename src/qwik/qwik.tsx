/** @jsxImportSource @builder.io/qwik */

import {
  $,
  Slot,
  component$,
  useOn,
  useSignal,
  useStore,
  useComputed$,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";

export const Counter = component$(() => {
  const count = useSignal(0);

  // to reuse function needs to be turned into QRL
  const increment = $(() => count.value++);

  return (
    <div>
      <h1>Counter = {count.value}</h1>
      <button class=" bg-gray-200 p-2 " onClick$={() => count.value++}>
        +1
      </button>
      <button class=" bg-gray-200 p-2 " onClick$={increment}>
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

  useTask$(() => {
    // with no track() it will run only on server
    console.log(" Hello server ");
    // BUT if the component is not rendered on first page load thenit WONT
  });

  useTask$(({ track }) => {
    // we need to track specific values in the store ... tracking the whole array doesnt work...
    // e.g. here just tracking length
    track(() => store.todos.length);
    console.log(" no of todos = ", store.todos.length);
  });

  useVisibleTask$(() => {
    console.log(" on load & visible ");
    const loc = window.localStorage.getItem("qwik-todos");
    console.log({ loc });
    try {
      const json = JSON.parse(loc);
      store.todos = json;
    } catch (e) {
      console.log(" bad data in loco");
    }
    //  this made weird errors when the id was a variable outside this scope
    // const loc = window.localStorage.getItem(loc_id);
  });

  const update = $((ev: Event, el: HTMLInputElement, i: number) => {
    console.log(" typed in el # ", i);
    store.todos[i].name = el.value;
    // update local storage
    window.localStorage.setItem("qwik-todos", JSON.stringify(store.todos));
  });

  return (
    <div>
      <h2>todos</h2>
      <ul class=" ml-6 ">
        {store.todos.map((todo, t) => (
          <li key={`${t}-${todo.id}`} class="  list-disc list-item">
            <input
              value={todo.name}
              onInput$={(ev, el) => update(ev, el, t)}
              // onInput$={(_, el) => (store.todos[t].name = el.value)}
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

export const Tabs = component$(() => {
  return (
    <>
      <h1>Tabs</h1>
      <p>
        I first returned my jsx as I was rendered by a map. with hardcoded
        buttons. we have to replace data.map and hardcode the tab buttons for
        this to work.
      </p>
      <TabsFirst tabs={["one", "two", "three"]}>
        <div class="tab">
          <h3>Tab One</h3>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, error.
            Animi repellendus eaque, magni ipsam rerum exercitationem beatae,
            dicta earum ea inventore numquam quia nulla velit temporibus
            reiciendis cumque obcaecati?
          </p>
        </div>
        <div class="tab">
          <h3>Tab Two</h3>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, error.
            Animi repellendus eaque, magni ipsam rerum exercitationem beatae,
            dicta earum ea inventore numquam quia nulla velit temporibus
            reiciendis cumque obcaecati?
          </p>
        </div>
        <div class="tab">
          <h3>Tab Three</h3>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, error.
            Animi repellendus eaque, magni ipsam rerum exercitationem beatae,
            dicta earum ea inventore numquam quia nulla velit temporibus
            reiciendis cumque obcaecati?
          </p>
        </div>
      </TabsFirst>

      <h1 class=" mt-10 text-2xl">Tab #2</h1>
      <p>use Qwik named slots to provide tabs & contents</p>
      <p>
        {`we have a somewhat reusable component that ships renders fully to html &
        minimal js, though the logic needs to be quite specific to fulfil the "no-jsx" `}
      </p>
      <p>
        {`and we can still build content dynamically w data.map. but the child component won't need it's jsx if content is passed in via qwik:slots`}
      </p>
      <p>
        {`this just requires tab buttons to have a data ttribute with tab number, and that tabs are wrapped in a div.tab `}
      </p>

      <TabSecond
        callback$={$((el: HTMLElement, buttons: HTMLElement[]) => {
          const activeClass = ["border-b-2", "border-black"];
          buttons?.forEach((but) => but.classList.remove(...activeClass));
          el.classList.add(...activeClass);
        })}
      >
        <div q:slot="tabs">
          <ul class=" flex gap-8">
            {"one,two,three".split(",").map((no, n) => (
              <li key={n}>
                <button data-t={n} class={" bg-gray-100  px-3 py-1"}>
                  Tab {no}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div q:slot="contents">
          {"one,two,three".split(",").map((sec, s) => (
            <div class="tab" key={s}>
              <h3>
                {sec} {sec} {sec} {sec} {sec} {sec} {sec}
                Tab {sec} Contents ... Lorem ipsum dolor sit amet consectetur
                adipisicing elit. Eum, error.
              </h3>
            </div>
          ))}
        </div>
      </TabSecond>
    </>
  );
});
export const TabsFirst = component$(({ tabs }: { tabs: string[] }) => {
  const activeTab = useSignal(0);

  return (
    <>
      <div>
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
          {/* this map would mean jsx gets returned */}
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
    </>
  );
});

export const TabSecond = component$(({ callback$ }: { callback$: any }) => {
  const activeTab = useSignal(0);
  const ref = useSignal<HTMLDivElement>();

  useOn(
    "click",
    $((ev) => {
      // listen to clicks on buttons
      const el = ev.target as HTMLElement;
      if (el?.tagName !== "BUTTON") return;

      // get tab index from html attribute
      const i = parseInt(el.getAttribute("data-t") ?? "");
      if (isNaN(i)) return;
      activeTab.value = i;

      const buttons = ref.value?.querySelectorAll("button");
      callback$(el, buttons);
    })
  );

  return (
    <div>
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

export const Form = component$(() => {
  const formdata = useStore({
    name: { value: "name...", error: "" },
    password: { value: "pass...", error: "" },
  });

  useComputed$(() => {
    console.log({
      name: formdata.name.value,
      pw: formdata.password.value,
    });
  });

  return (
    <>
      <h1>How would we do a form in qwik?</h1>
      <form
        preventdefault:submit
        onSubmit$={(ev, el) => {
          console.log(" Form submit : ", ev, el, formdata.name.value);

          if (!formdata.name.value) {
            formdata.name.error = "Please enter name";
            return;
          } else {
            formdata.name.error = "";
          }

          if (!formdata.password.value) {
            formdata.password.error = "Please enter password";
            return;
          } else {
            formdata.password.error = "";
          }
        }}
      >
        <div>
          <label>
            {" "}
            Name:
            <input
              id="name"
              value={formdata.name.value}
              onInput$={(_, el) => (formdata.name.value = el.value)}
            />
          </label>
          <p class={!formdata.name.error ? "  hidden " : " block  "}>
            {formdata.name.error}
          </p>
        </div>
        <div>
          <label>
            {" "}
            password:
            <input
              id="password"
              value={formdata.password.value}
              onInput$={(_, el) => (formdata.password.value = el.value)}
            />
          </label>
          <p class={!formdata.password.error ? " hidden " : "  block "}>
            {formdata.password.error}
          </p>
        </div>

        <button>Submit</button>
      </form>
    </>
  );
});
