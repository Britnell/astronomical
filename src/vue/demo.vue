<style scoped>
section {
  padding: 0 2em;
  margin: 2em 0;
}
</style>
<template>
  <div>{{ message }}</div>

  <section>
    <p>
      favourite foods :
      <ul>
        <li v-for="(item, i) in food" :key="i" :class="{ bold: i % 2 === 0 }">
          <span :class="['a',`b-${i}`,{odd: i%2===1}]">
            {{ item }},
          </span>
        </li>
      </ul>
    </p>
  </section>

  <section>
    <p>Count is: {{ count }} x 2 = {{ double }}</p>
    <button  class="px-2 py-1 " :class="[' bg-gray-200', (count<3?' bg-red-300':''), {'bg-green-300':count%4===0} ]" @click="increment">+1</button>
  </section>

  <section>
    <p>An accordion</p>
    <button
      class="px-2 bg-blue-200"
      role="button"
      @click="openMenu(true)"
      v-if="!isOpen"
    >
      Open Menu
    </button>
    <button
      class="px-2 bg-blue-200"
      role="button"
      @click="openMenu(false)"
      v-else
    >
      Close Menu
    </button>
    <div v-if="isOpen">
      <p>blablab menu content lorem ipsum</p>
    </div>
  </section>

  <section>
    <div :id="ip">
      <label
        >Input value : "{{ ip }}"
        <div>
          <input :value="ip" @input="(event) => (ip = event.target?.value)" />
        </div>
      </label>
    </div>
  </section>

  <section>
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
  </section>

  <section>
    <h2>Refs :</h2>
    <p ref="pref"></p>
  </section>

  <div>
    <p>Events</p>
    <p>Last bloop : {{ lastBloop % 100000 }}</p>
    <Blooper @bloop="onBloop">lorem ipsum</Blooper>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
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

let intvl;
onMounted(() => {
  intvl = setInterval(() => {
    if (pref.value)
      pref.value.textContent = `ref : ${Math.floor(Date.now() / 500)}`;
  }, 500);
});
onUnmounted(() => {
  intvl && clearInterval(intvl);
});

const lastBloop = ref(0);
const onBloop = (val: number) => {
  console.log(`Oh bloop! @${val}`);
  lastBloop.value = val;
};
</script>
