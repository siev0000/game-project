<script setup>
import { onMounted } from "vue";
import { applyGlobalScale } from "@/components/useScale.js";

onMounted(() => {
  applyGlobalScale("scalable-root");
});
</script>

<template>
  <div id="scalable-root">
    <router-view />
  </div>
</template>

<style>
@import "@/css/useScale.css";
</style>