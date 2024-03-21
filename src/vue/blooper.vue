<template>
  <button class="px-1 bg-blue-200" @click="bleep">Bloop</button>
  <p class="subtitle">
    <slot></slot>
  </p>
</template>

<script setup lang="ts">
const emit = defineEmits(["bloop"]);

const bleep = () => {
  emit("bloop", Date.now());
};
</script>
