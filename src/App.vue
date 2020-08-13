<template>
  <div id="app">
    <GenReport />
  </div>
</template>

<script>
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
// eslint-disable-next-line
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);

import GenReport from "./components/GenReport";

export default {
  name: "App",
  components: {
    GenReport,
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
