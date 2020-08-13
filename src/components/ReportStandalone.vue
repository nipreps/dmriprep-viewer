<template>
  <div class="mt-3 container">
    <div v-if="report">
      <h2 class="mt-3 pt-3">Corrected dwi</h2>
      <p class="lead">Motion and distortion corrected file</p>

      <div style="background-color: black;">
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
        >
        </sprite4d>
      </div>
      <vue-slider
        ref="timeSlider"
        v-model="time"
        :min="0"
        :max="report.dwi_corrected[0].num_slices - 1"
      >
      </vue-slider>

      <div style="height: 200px; width: 100%; display: inline-flex;">
        <line-chart
          id="motion_params"
          :data="report.eddy_params"
          :outlier_indices="report.outlier_volumes"
          xlabel="TR"
          ylabel="RMS"
          :highlightIdx="time"
        >
        </line-chart>
      </div>

      <CarpetPlot :data="report.carpetplot" :highlightIdx="time" />

      <vue-slider
        ref="timeSlider"
        v-model="time"
        :min="0"
        :max="report.dwi_corrected[0].num_slices - 1"
      >
      </vue-slider>

      <QSpaceGroup :report="report" :time="time" />

      <h2 class="mt-3 pt-3">Registration + Brain Mask</h2>
      <p class="lead">Brain mask computed on T1w, and mapped to B0</p>

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
    </div>
  </div>
</template>

<script>
// import axios from 'axios';
import CarpetPlot from "./CarpetPlot";
import QSpaceGroup from "./QSpaceGroup";
import vueSlider from "vue-slider-component";
import sprite4d from "./Sprite4D";
import lineChart from "./LineChart";
import BrainSprite from "./BrainSprite.vue";
import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import VueResize from "vue-resize";

// eslint-disable-next-line
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "vue-slider-component/theme/antd.css";
import "vue-resize/dist/vue-resize.css";

Vue.use(VueResize);
Vue.use(BootstrapVue);

export default {
  name: "report",
  components: {
    QSpaceGroup,
    sprite4d,
    vueSlider,
    lineChart,
    BrainSprite,
    CarpetPlot,
  },
  props: {
    report: {
      type: Object,
    },
  },
  data() {
    return {
      time: 0,
      spriteSlice: 0,
      globalPosition: null,
      autoRotate: false,
      showReflection: true,
    };
  },
  methods: {
    get_mid_slice() {
      return Math.floor(this.report.b0.num_slices / 2);
    },
    updateGlobalPosition(position) {
      this.globalPosition = position;
    },
  },
  created() {},
  mounted() {
    this.$nextTick(() => {
      if (this.report) {
        this.spriteSlice = this.get_mid_slice();
      }
    });
  },
  watch: {
    report() {
      if (this.report) {
        this.spriteSlice = this.get_mid_slice();
      }
    },
  },
};
</script>

<style></style>
