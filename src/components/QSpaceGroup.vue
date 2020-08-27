<!--
/**
 * This parent component holds two QSpaceViewers in two columns.
 *
 * It also contains two checkboxes to toggle the auto-rotate feature and to
 * toggle the display of the reflected points.
 */
 -->
<template>
  <div id="qspace-parent">
    <p class="lead">q-space Sampling</p>
    <b-row>
      <b-col>
        <b-checkbox v-model="autoRotate">
          auto rotate
        </b-checkbox>
      </b-col>
      <b-col>
        <b-checkbox v-model="showReflection">
          show reflected points
        </b-checkbox>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <QSpaceViewer
          elementId="qSpaceViewerPre"
          :qcoords="report.q_coords"
          :colors="report.color"
          :cameraPosition="globalPosition"
          v-on:updateCameraPosition="updateGlobalPosition"
          :autoRotate="autoRotate"
          :showReflectedPoints="showReflection"
          :highlightIdx="time"
        />
        <p class="lead">Original</p>
      </b-col>
      <b-col>
        <QSpaceViewer
          elementId="qSpaceViewerPost"
          :qcoords="report.q_coords"
          :colors="report.color"
          :cameraPosition="globalPosition"
          v-on:updateCameraPosition="updateGlobalPosition"
          :autoRotate="autoRotate"
          :showReflectedPoints="showReflection"
          :highlightIdx="time"
        />
        <p class="lead">Corrected</p>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import QSpaceViewer from "./QSpaceViewer";

export default {
  name: "QSpaceGroup",
  components: {
    QSpaceViewer,
  },
  props: {
    report: {
      type: Object,
    },
    time: {
      type: Number,
    },
  },
  data() {
    return {
      autoRotate: false,
      showReflection: false,
      globalPosition: null,
    };
  },
  methods: {
    updateGlobalPosition(position) {
      this.globalPosition = position;
    },
  },
};
</script>
