<template>
  <b-container fluid class="px-0">
    <b-container fluid class="px-0" v-if="report">
      <topBar
        :reportProp="report"
        :ratingProp="rating"
        v-on:ratingsDownloadRequested="ratingsDownloadRequested"
        v-on:ratingsUploaded="ratingsUploaded"
      ></topBar>
      <b-row>
        <b-col>
          <h1>{{ report.subject_id }}</h1>
          <h2 class="mt-3 pt-3">Corrected dwi</h2>
          <p class="lead">Motion and distortion corrected file</p>

          <div style="background-color: black;">
            <explainer
              :explainer-text="explainerText.dwiTimeSeriesSprite"
            ></explainer>
            <sprite4d
              v-for="view in report.dwi_corrected"
              :key="view.orientation"
              :M="view.M"
              :N="view.N"
              :img="view.img"
              :num_slices="view.num_slices"
              :pix="view.pix"
              :id="view.orientation"
              :time="time"
              :overlayMode="false"
              opacity="1"
            ></sprite4d>
          </div>
          <vue-slider
            ref="timeSlider"
            v-model="time"
            :min="0"
            :max="report.dwi_corrected[0].num_slices - 1"
          ></vue-slider>

          <explainer :explainer-text="explainerText.lineChart"></explainer>
          <div style="height: 200px; width: 100%; display: inline-flex;">
            <line-chart
              id="motion_params"
              :data="report.eddy_params"
              :outlier_indices="report.outlier_volumes"
              xlabel="TR"
              ylabel="RMS"
              :highlightIdx="time"
            ></line-chart>
          </div>

          <explainer :explainer-text="explainerText.carpetPlot"></explainer>
          <CarpetPlot :data="report.carpetplot" :highlightIdx="time" />

          <vue-slider
            ref="timeSlider"
            v-model="time"
            :min="0"
            :max="report.dwi_corrected[0].num_slices - 1"
          ></vue-slider>

          <!-- <explainer :explainer-text="explainerText.qSpace"></explainer>
          <QSpaceGroup :report="report" :time="time" /> -->

          <h2 class="mt-3 pt-3">Registration + Brain Mask</h2>
          <p class="lead">Brain mask computed on T1w, and mapped to B0</p>
          <explainer
            :explainer-text="explainerText.brainMaskSprite"
          ></explainer>
          <BrainSprite
            id="brainMaskSprite"
            ref="brainMaskSprite"
            :base_dim_x="report.b0.pix"
            :base_dim_y="report.b0.pix"
            :overlay_dim_x="report.anat_mask.pix"
            :overlay_dim_y="report.anat_mask.pix"
            :base="report.b0.img"
            :overlay="report.anat_mask.img"
          />

          <h2 class="mt-3 pt-3">DTI: ColorFA</h2>
          <p class="lead">Color FA mapped on B0</p>

          <explainer :explainer-text="explainerText.colorFASprite"></explainer>
          <BrainSprite
            id="colorFASprite"
            ref="colorFASprite"
            :base_dim_x="report.b0.pix"
            :base_dim_y="report.b0.pix"
            :overlay_dim_x="report.colorFA.pix"
            :overlay_dim_y="report.colorFA.pix"
            :base="report.b0.img"
            :overlay="report.colorFA.img"
          />
        </b-col>
      </b-row>
    </b-container>
    <spinner v-else></spinner>
  </b-container>
</template>

<script>
import BrainSprite from "./BrainSprite.vue";
import CarpetPlot from "./CarpetPlot";
// import QSpaceGroup from "./QSpaceGroup";
import explainer from "./Explainer";
import lineChart from "./LineChart";
import sprite4d from "./Sprite4D";
import topBar from "./TopBar";
import Vue from "vue";
import VueResize from "vue-resize";
import vueSlider from "vue-slider-component";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

// eslint-disable-next-line
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "vue-slider-component/theme/antd.css";
import "vue-resize/dist/vue-resize.css";

Vue.use(VueResize);
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default {
  name: "report",
  components: {
    BrainSprite,
    CarpetPlot,
    // QSpaceGroup,
    explainer,
    lineChart,
    sprite4d,
    topBar,
    vueSlider,
  },
  props: {
    reportProp: {
      type: Object,
      default: null,
    },
    ratingProp: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      time: 0,
      spriteSlice: 0,
      globalPosition: null,
      autoRotate: false,
      showReflection: true,
      report: null,
      rating: null,
      explainerText: {
        dwiTimeSeriesSprite: "TODO: Explain the dwi corrected 4D sprite.",
        lineChart: "TODO: Explain the motion params line chart.",
        carpetPlot: "TODO: Explain the carpet plot.",
        qSpace: "TODO: Explain the qspace viewer.",
        brainMaskSprite:
          "TODO: Explain the registration and brain mask sprite.",
        colorFASprite: "TODO: Explain the colorFA sprite.",
      },
    };
  },
  methods: {
    get_mid_slice() {
      return Math.floor(this.report.b0.num_slices / 2);
    },
    updateGlobalPosition(position) {
      this.globalPosition = position;
    },
    ratingsDownloadRequested() {
      this.$emit("ratingsDownloadRequested");
    },
    ratingsUploaded(e) {
      this.$emit("ratingsUploaded", e);
    },
  },
  mounted() {
    if (this.reportProp) {
      this.report = this.reportProp;
    }
    if (this.ratingProp) {
      this.rating = this.ratingProp;
    }

    this.$nextTick(() => {
      if (this.report) {
        this.spriteSlice = this.get_mid_slice();
      }
    });
  },
  watch: {
    reportProp: {
      immediate: true,
      handler(reportProp) {
        if (reportProp) {
          this.report = reportProp;
        }
      },
      deep: true,
    },
    ratingProp: {
      immediate: true,
      handler: function () {
        if (this.ratingProp) {
          this.rating = this.ratingProp;
        }
      },
      deep: true,
    },
    report: {
      immediate: true,
      handler: function () {
        if (this.report) {
          this.spriteSlice = this.get_mid_slice();
        }
      },
      deep: true,
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
