<template>
  <b-container v-if="report">
    <b-row>
      <b-button-group>
        <b-button
          v-b-toggle.sidebar-backdrop
          id="sidebar-button"
          variant="outline-primary"
          class="mb-2"
        >
          <b-icon icon="layout-sidebar" aria-hidden="true"></b-icon>
        </b-button>
        <b-button
          id="back-button"
          to="/report"
          variant="outline-primary"
          class="mb-2"
        >
          <b-icon icon="search" aria-hidden="true"></b-icon>
        </b-button>
        <b-button id="info-button" variant="outline-primary" class="mb-2">
          <b-icon icon="info-circle" aria-hidden="true"></b-icon>
        </b-button>
        <b-popover target="info-button" placement="bottom" triggers="click">
          <template v-slot:title>{{ report.subject_id }}</template>
          pipeline: {{ report.pipeline }}
          <br />
          version: {{ report.pipeline_version }}
          <br />
          {{ report.boilerplate }}
        </b-popover>
        <b-button
          id="download-button"
          variant="outline-primary"
          class="mb-2"
          @click="download"
        >
          <b-icon icon="download" aria-hidden="true"></b-icon>
        </b-button>
      </b-button-group>
      <b-tooltip target="sidebar-button" triggers="hover"
        >toggle sidebar</b-tooltip
      >
      <b-tooltip target="back-button" triggers="hover"
        >back to the input page</b-tooltip
      >
      <b-tooltip target="info-button" triggers="hover"
        >info about this subject/study</b-tooltip
      >
      <b-tooltip target="download-button" triggers="hover"
        >download this report.json file</b-tooltip
      >
    </b-row>
  </b-container>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

// eslint-disable-next-line
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import * as FileSaver from "file-saver";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default {
  name: "topBar",
  props: {
    reportProp: {
      type: Object,
    },
    sidebarOn: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      report: null,
    };
  },
  methods: {
    download() {
      var fileToSave = new Blob([JSON.stringify(this.report)], {
        type: "application/json",
        name: "report.json",
      });
      FileSaver.saveAs(fileToSave, "report.json");
    },
  },
  mounted() {
    if (this.reportProp) {
      this.report = this.reportProp;
    }
  },
  watch: {
    reportProp() {
      if (this.reportProp) {
        this.report = this.reportProp;
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
