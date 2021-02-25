<template>
  <div>
    <resize-observer @notify="handleResize" />
    <svg
      id="carpetsvg"
      ref="chart"
      class="carpetplot"
      :width="width"
      :height="height"
    >
      <g :transform="'translate(' + margin.left + ',' + margin.top + ')'">
        <rect
          v-for="d in dataFlattened"
          :key="d.i + ':' + d.j"
          :x="x(d.i)"
          :y="y(d.j)"
          rx="4"
          ry="4"
          :width="x.bandwidth()"
          :height="y.bandwidth()"
          :fill="myColor(d.value)"
          stroke-width="4"
          stroke="none"
          :opacity="d.i === highlightIdx ? 1 : 0.5"
        ></rect>
      </g>
    </svg>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "Carpetplot",
  props: {
    data: {
      type: Array,
    },
    highlightIdx: {
      type: Number,
    },
  },
  data() {
    return {
      margin: { top: 10, right: 25, bottom: 10, left: 40 },
      mounted: false,
      width: null,
      height: 500,
    };
  },
  computed: {
    innerWidth() {
      return this.width - this.margin.left - this.margin.right;
    },
    innerHeight() {
      return 450 - this.margin.top - this.margin.bottom;
    },
    dataFlattened() {
      const nRows = this.data.length;
      const nCols = this.data[0].length;
      const output = [];

      for (let i = 0; i < nRows; i += 1) {
        for (let j = 0; j < nCols; j += 1) {
          output.push({ i, j, value: this.data[i][j] });
        }
      }
      return output;
    },
    x() {
      // Build X scales and axis:
      const myGroups = d3.map(this.dataFlattened, function (d) {
          return d.i;
        }).keys();
      return d3.scaleBand().range([0, this.innerWidth]).domain(myGroups).padding(0.05);
    },
    y() {
      // Build Y scales and axis:
      const myVars = d3.map(this.dataFlattened, function (d) {
          return d.j;
        }).keys();
      return d3.scaleBand().range([this.innerHeight, 0]).domain(myVars).padding(0.05);
    },
    myColor() {
      // Build color scale
      // const maxVal = d3.max(this.dataFlattened, d => d.value)
      // const minVal = d3.min(this.dataFlattened, d => d.value)

      return d3.scaleSequential().interpolator(d3.interpolateInferno)
        // .domain([minVal, maxVal]);
        .domain([0, 1]);
    }
  },
  mounted() {
    this.mounted = true;
    this.width = this.$refs.chart.clientWidth;
  },
  methods: {
    handleResize() {
      this.width = this.$refs.chart.clientWidth;
    },
  },
};
</script>

<style>
.carpetplot {
  width: 100%;
  height: 100%;
}
</style>
