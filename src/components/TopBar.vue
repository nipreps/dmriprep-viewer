<template>
  <b-button-toolbar class="sticky-top ml-2">
    <b-button-group>
      <b-button
        v-b-toggle.sidebar-backdrop
        id="sidebar-button"
        variant="outline-primary"
        class="mb-2 header-button"
      >
        <b-icon icon="layout-sidebar" aria-hidden="true"></b-icon>
      </b-button>
      <b-button
        id="back-button"
        to="/report"
        variant="outline-primary"
        class="mb-2 header-button"
      >
        <b-icon icon="search" aria-hidden="true"></b-icon>
      </b-button>
      <!-- <b-button
        id="info-button"
        variant="outline-primary"
        class="mb-2 header-button"
      >
        <b-icon icon="info-circle" aria-hidden="true"></b-icon>
      </b-button>
      <b-popover target="info-button" placement="auto" triggers="click">
        <template v-slot:title>{{ subjectId }}</template>
        pipeline: {{ report.pipeline }}
        <br />
        version: {{ report.pipeline_version }}
        <br />
        {{ report.boilerplate }}
      </b-popover> -->
      <b-button
        id="download-button"
        variant="outline-primary"
        class="mb-2 header-button"
        @click="download"
      >
        <b-icon icon="download" aria-hidden="true"></b-icon>
      </b-button>
      <b-button
        id="stats-button"
        variant="outline-primary"
        class="mb-2 header-button"
        v-if="!isGroupReport"
      >
        <b-icon icon="bar-chart" aria-hidden="true"></b-icon>
      </b-button>
      <b-popover
        target="stats-button"
        placement="bottom"
        triggers="click"
        v-if="!isGroupReport"
      >
        <template v-slot:title>{{ subjectId }}</template>
        Here are distributions of some key QC metrics
      </b-popover>
      <b-button
        id="rating-button"
        variant="outline-primary"
        class="mb-2 header-button"
        v-if="!isGroupReport"
        v-b-modal.rating-modal
      >
        <b-iconstack>
          <!-- <b-icon stacked icon="hand-thumbs-up" scale="0.75" shift-v="6" shift-h="-6" aria-hidden="true"></b-icon> -->
          <b-icon stacked icon="check-circle" scale="0.75" shift-v="6" shift-h="-6" aria-hidden="true"></b-icon>
          <b-icon stacked icon="slash" scale="1.5" aria-hidden="true"></b-icon>
          <!-- <b-icon stacked icon="hand-thumbs-down" scale="0.75" shift-v="-6" shift-h="6" aria-hidden="true"></b-icon> -->
          <b-icon stacked icon="x-circle" scale="0.75" shift-v="-6" shift-h="6" aria-hidden="true"></b-icon>
        </b-iconstack>
      </b-button>
      <b-modal
        id="rating-modal"
        ref="rating-modal"
        :title="subjectId"
        @ok="onOk"
        @hidden="handleHidden"
        v-if="!isGroupReport"
      >
        <div class="mb-2">
          Rate this subject
        </div>
        <b-form
          ref="form"
          @submit.stop.prevent="handleSubmit"
          v-if="rating"
        >
          <b-form-group
            id="input-group-anat"
            label="T1w"
            label-for="t1w-rating"
            description="Rate the anatomical image quality"
            label-cols="2"
            content-cols="12"
            invalid-feedback="rating required"
            :state="state(rating.anatRating)"
          >
            <b-form-rating
              v-model="rating.anatRating"
              show-clear
              show-value
              show-value-max
              icon-clear="slash-circle"
              :state="state(rating.anatRating)"
              required
            ></b-form-rating>
          </b-form-group>

          <b-form-group
            id="input-group-dwi"
            label="DWI"
            label-for="dwi-rating"
            description="Rate the diffusion image quality"
            label-cols="2"
            content-cols="12"
            invalid-feedback="rating required"
            :state="state(rating.dwiRating)"
          >
            <b-form-rating
              v-model="rating.dwiRating"
              show-clear
              show-value
              show-value-max
              icon-clear="slash-circle"
              :state="state(rating.dwiRating)"
              required
            ></b-form-rating>
          </b-form-group>

          <b-form-group
            id="input-group-overall"
            label="Overall"
            label-for="overall-rating"
            description="Rate the overall quality"
            label-cols="2"
            content-cols="12"
            invalid-feedback="rating required"
            :state="state(rating.overallRating)"
          >
            <b-form-rating
              id="overall-rating"
              v-model="rating.overallRating"
              show-clear
              show-value
              show-value-max
              icon-clear="slash-circle"
              :state="state(rating.overallRating)"
              required
            ></b-form-rating>
          </b-form-group>
        </b-form>
      </b-modal>
      <b-dropdown variant="outline-primary" class="mb-2 header-button">
        <template #button-content>
          <b-icon icon="three-dots" id="more-button" aria-hidden="true"></b-icon>
        </template>
        <b-dropdown-item-button
          id="file-issue"
          variant="outline-primary"
          onclick="window.open('https://github.com/nipreps/dmriprep-viewer/issues/new','_blank')"
        >
          <b-icon icon="bug" class="mr-2" aria-hidden="true"></b-icon>
          file bug report
        </b-dropdown-item-button>
      </b-dropdown>
    </b-button-group>
    <b-tooltip target="sidebar-button" triggers="hover"
      >toggle sidebar</b-tooltip
    >
    <b-tooltip target="back-button" triggers="hover"
      >back to the input page</b-tooltip
    >
    <!-- <b-tooltip target="info-button" triggers="hover"
      >info about this subject/study</b-tooltip
    > -->
    <b-tooltip target="download-button" triggers="hover"
      >download this report.json file</b-tooltip
    >
    <b-tooltip target="stats-button" triggers="hover" v-if="!isGroupReport"
      >show QC summary stats</b-tooltip
    >
    <b-tooltip target="rating-button" triggers="hover" v-if="!isGroupReport"
      >rate this subject</b-tooltip
    >
    <b-tooltip target="more-button" triggers="hover"
      >more options</b-tooltip
    >
  </b-button-toolbar>
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
    ratingProp: {
      type: Object,
      default: null,
    },
    sidebarOn: {
      type: Boolean,
      default: false,
    },
    isGroupReport: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      report: null,
      rating: null,
      subjectId: "loading...",
    };
  },
  methods: {
    state(rating) {
      return rating != null;
    },
    checkFormValidity() {
      const valid = (
        this.rating.anatRating != null
        && this.rating.dwiRating != null
        && this.rating.overallRating != null);
      return valid
    },
    onOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault()
      // Trigger submit handler
      this.handleSubmit()
    },
    handleHidden() {
      // If rater cancelled the rating form, reset the reviewed and whenRated
      // fields if the other fields are invalid
      if (!this.checkFormValidity()) {
        this.rating.reviewed = false;
        this.rating.whenRated = null;
      }
    },
    handleSubmit() {
      if (!this.checkFormValidity()) {
        return
      }

      this.rating.whenRated = (new Date()).toString();
      this.rating.reviewed = true;

      this.$nextTick(() => {
        this.$bvModal.hide('rating-modal')
      })
    },
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
      this.subjectId = this.reportProp["subject_id"]
    }
    if (this.ratingProp) {
      this.rating = this.ratingProp;
    }
  },
  watch: {
    reportProp() {
      if (this.reportProp) {
        this.report = this.reportProp;
        this.subjectId = this.reportProp["subject_id"]
      }
    },
    ratingProp() {
      if (this.ratingProp) {
        this.rating = this.ratingProp;
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.header-button:not(:hover) {
  background-color: #fff;
}
</style>
