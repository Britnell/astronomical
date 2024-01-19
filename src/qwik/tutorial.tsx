/** @jsxImportSource @builder.io/qwik */

import { $, component$, sync$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <h1>Tutorial</h1>
      <Sync />
    </>
  );
});

const Sync = component$(() => (
  <>
    <p>
      Becuase event handlers are 'async' we also cant access ev.target, thats
      why it is passed as 2nd arg. but qwik can prevent default ahead of time
      for us :
    </p>
    <a
      href="/"
      preventdefault:click
      onClick$={(ev) => console.log(" clicked ", ev)}
      class=" bg-teal-200"
    >
      click me too
    </a>
    <form
      preventdefault:submit
      onSubmit$={(ev, el) => {
        console.log(" submitting form ", el);
      }}
    >
      ...
    </form>
    <p>
      all code is downloaded async, so e.g. we cant catch an event and prevent
      it. with sync we can tell qwik to download code sync & run it. but sync
      has quite a few gotchas and this does not prevent the event ...
    </p>
    <a
      href="/"
      onClick$={[
        sync$((event: MouseEvent): void => event.preventDefault()),
        $((ev) => {
          console.log("clicked ", ev);
        }),
      ]}
      class="bg-green-200"
    >
      click me!
    </a>
  </>
));
