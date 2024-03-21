<template>
  <div v-if="timer.state === 'ready'">
    <h2>pomodoro!</h2>
    <p>Ready? lets go</p>
    <button @click="start">begin</button>
  </div>

  <div v-if="timer.state === 'running'">
    <h2>Let's Pomo!</h2>
    <p>{{ digits[0] }} : {{ digits[1] }}</p>
    <div>
      <button v-if="timer.paused" @click="resume">resume</button>
      <button v-else @click="pause">pause</button>
    </div>
    <div>
      <button @click="cancel">Stop</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
type States = "ready" | "running" | "break";
const timer = reactive({
  state: "ready",
  elapsed: 0,
  begin: 0,
  paused: false,
  duration: 25 * 60,
});
const ticker = ref(null);
const digits = ref(["", ""]);
const showDigits = (d: number) => {
  const min = Math.floor(d / 60)
    .toString()
    .padStart(2, "0");
  const sec = (d % 60).toString().padStart(2, "0");
  return [min, sec];
};
const calcTime = (begin: number, elapsed: number) => {
  const t = Date.now();
  return Math.floor(elapsed + (t - begin) / 1000);
};
watch(timer, (upd) => {
  if (upd.state !== "running" || upd.paused) {
    clearInterval(ticker.value);
    return;
  }
  ticker.value = setInterval(() => {
    const d = calcTime(timer.begin, timer.elapsed);
    // if remain < 0 == DONE!
    digits.value = showDigits(timer.duration - d);
    // console.log("tick ", d, t);
  }, 1000);
});
// Local Storage
const lclkey = "pomodoro-app";
onMounted(() => {
  try {
    const str = localStorage.getItem(lclkey);
    if (!str) return;
    const local = JSON.parse(str);
    // timer = local;
    timer.begin = local.begin;
    timer.state = local.state;
    timer.paused = local.paused;
    timer.elapsed = local.elapsed;
  } catch (e) {}
});
watch(timer, (upd, prev) => {
  localStorage.setItem(lclkey, JSON.stringify(upd));
});
const start = () => {
  timer.begin = Date.now();
  timer.state = "running";
  timer.paused = false;
  timer.elapsed = 0;
};
const pause = () => {
  const d = calcTime(timer.begin, timer.elapsed);
  timer.elapsed = d;
  timer.paused = true;
};
const resume = () => {
  timer.begin = Date.now();
  timer.paused = false;
};
const cancel = () => (timer.state = "ready");
//
</script>

<style scoped></style>
