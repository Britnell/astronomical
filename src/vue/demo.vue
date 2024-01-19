html
<template>
  <div>{{ message }}</div>
  <p>
    favourite foods :
    <span v-for="item in food"> {{ item }}, </span>
  </p>
  <button class="px-2 bg-gray-200" @click="increment">
    Count is: {{ count }} x 2 = {{ double }}
  </button>
  <p>An accordion</p>
  <button
    class="px-2 bg-blue-200"
    role="button"
    @click="openMenu(true)"
    v-if="!isOpen"
  >
    Open Menu
  </button>
  <button role="button" @click="openMenu(false)" v-else>Close Menu</button>
  <div v-if="isOpen">
    <p>blablab menu content lorem ipsum</p>
  </div>

  <div>
    <label
      >Input value : "{{ ip }}"
      <div>
        <input :value="ip" @input="(event) => (ip = event.target?.value)" />
      </div>
    </label>
  </div>
  <div>
    <label>
      Password: {{ password }}
      <div>
        <input id="password" v-model="password" />
      </div>
    </label>
    <p>
      encrypted :
      {{
        password
          .split("")
          .map((ch) => ch.charCodeAt(0))
          .join("")
      }}
      <br />
    </p>
  </div>

  <div>
    <p ref="pref">Refs</p>
  </div>

  <div>
    <p>Events</p>
    <p>Last bloop : {{ lastBloop % 100000 }}</p>
    <Blooper @bloop="onBloop">lorem ipsum</Blooper>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Blooper from "./blooper.vue";

defineProps({
  message: {
    type: String,
    required: true,
  },
});
const food = ["Pizza", "French fries", "Spaghetti"];

const count = ref(0);
const increment = () => (count.value += 1);
const double = computed(() => count.value * 2);

watch(count, (v) => {
  console.log(` Count is now ${v}`);
});
const isOpen = ref<boolean>(false);
const openMenu = (action: boolean) => (isOpen.value = action);

const ip = ref("hello");
const password = ref("");

const pref = ref<HTMLParagraphElement>();

onMounted(() => {
  setInterval(() => {
    if (pref.value)
      pref.value.textContent = `ref : ${Math.floor(Date.now() / 1000)}`;
  }, 1000);
});

const lastBloop = ref(0);
const onBloop = (val: number) => {
  console.log(`Oh bloop! @${val}`);
  lastBloop.value = val;
};
</script>
<style scoped></style>
