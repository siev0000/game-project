<script setup>
import { onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { applyGlobalScale } from "@/components/useScale.js";
import useScaleCss from "@/css/useScale.css?url";
import gestScaleCss from "@/css/gestScale.css?url";
import electronicLifeCss from "@/css/electronicLife.css?url";

const route = useRoute();
const scaleLinkId = "scale-css";

const setScaleCss = (path) => {
  const href = path === "/guest"
    ? gestScaleCss
    : path === "/electronic-life"
      ? electronicLifeCss
      : useScaleCss;
  let link = document.getElementById(scaleLinkId);
  if (!link) {
    link = document.createElement("link");
    link.id = scaleLinkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
};

onMounted(() => {
  applyGlobalScale("scalable-root");
  setScaleCss(route.path);
});

watch(
  () => route.path,
  (path) => setScaleCss(path)
);

onBeforeUnmount(() => {
  const link = document.getElementById(scaleLinkId);
  if (link) {
    link.remove();
  }
});
</script>

<template>
  <div id="scalable-root">
    <router-view />
  </div>
</template>
