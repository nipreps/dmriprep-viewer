<template>
  <b-container v-if="report">
    <b-row>
      <b-col class="text-left">
        <router-link to="/report" replace>
          <b-button variant="outline-info" class="mb-2">
            <b-icon icon="arrow-left-circle" aria-hidden="true"></b-icon> back
          </b-button>
        </router-link>
      </b-col>
      <b-col class="text-center">
        <b-button id="info-button" variant="outline-info">
          <b-icon icon="info-circle" aria-hidden="true"></b-icon> info
        </b-button>
        <b-popover
          target="info-button"
          placement="bottom"
          :title="report.subject_id"
          triggers="click"
          :content="`pipeline: ${report.pipeline}<br>version: ${report.pipeline_version}`"
        >
          <template v-slot:title>{{ report.subject_id }}</template>
          pipeline: {{ report.pipeline }}<br />version:
          {{ report.pipeline_version }}
        </b-popover>
      </b-col>
      <b-col class="text-right">
        <b-button variant="outline-info" class="mb-2" @click="download">
          <b-icon icon="download" aria-hidden="true"></b-icon> download
        </b-button>
      </b-col>
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
