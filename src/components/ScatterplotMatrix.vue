<template>
  <div>
    <resize-observer @notify="handleResize" />
    <svg id="scattersvg" ref="chart" class="scatterplot-matrix"></svg>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "ScatterplotMatrix",
  props: {
    data: {
      type: Array,
    },
    metrics: {
      type: Array,
    },
  },
  data() {
    return {
      margin: { top: 10, right: 10, bottom: 10, left: 20 },
      width: null,
      padding: 20,
      brushedSubjects: null,
    };
  },
  computed: {
    height() {
      return this.width + this.padding;
    },
    size() {
      return (
        (this.width - (this.columns.length + 1) * this.padding) /
          this.columns.length +
        this.padding
      );
    },
    columns() {
      return Object.keys(this.data[0]).filter(
        (d) => this.metrics.includes(d) && typeof this.data[0][d] === "number"
      );
    },
    yAxis() {
      const axis = d3
        .axisLeft()
        .ticks(6)
        .tickSize(-this.size * this.columns.length);
      const self = this;
      return (g) =>
        g
          .selectAll("g")
          .data(this.y)
          .join("g")
          .attr("transform", (d, i) => `translate(0,${i * self.size})`)
          .each(function (d) {
            return d3.select(this).call(axis.scale(d));
          })
          .call((g) => g.select(".domain").remove())
          .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));
    },
    xAxis() {
      const axis = d3
        .axisBottom()
        .ticks(6)
        .tickSize(this.size * this.columns.length);
      const self = this;
      return (g) =>
        g
          .selectAll("g")
          .data(this.x)
          .join("g")
          .attr("transform", (d, i) => `translate(${i * self.size},0)`)
          .each(function (d) {
            return d3.select(this).call(axis.scale(d));
          })
          .call((g) => g.select(".domain").remove())
          .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));
    },
    x() {
      const paddingPlusMargin =
        this.padding + this.margin.left + this.margin.right;
      return this.columns.map((c) =>
        d3
          .scaleLinear()
          .domain(d3.extent(this.data, (d) => d[c]))
          .rangeRound([
            paddingPlusMargin / 2,
            this.size - paddingPlusMargin / 2,
          ])
      );
    },
    y() {
      const paddingPlusMargin =
        this.padding + this.margin.top + this.margin.top;
      const self = this;
      return this.x.map((x) =>
        x
          .copy()
          .range([self.size - paddingPlusMargin / 2, paddingPlusMargin / 2])
      );
    },
  },
  watch: {
    brushedSubjects: {
      deep: true,
      handler: function () {
        this.$emit("updateBrushedSubjects", this.brushedSubjects);
      },
    },
  },
  mounted() {
    this.width = this.$refs.chart.clientWidth;
    this.brushedSubjects = this.data.map((d) => d.participant_id);
    this.init();
  },
  methods: {
    init() {
      // append the svg object to the body of the page
      const svg = d3
        .select("#scattersvg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr(
          "transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")"
        );

      svg
        .append("style")
        .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

      svg.append("g").call(this.xAxis);

      svg.append("g").call(this.yAxis);

      const self = this;
      const cell = svg
        .append("g")
        .selectAll("g")
        .data(
          d3.cross(d3.range(this.columns.length), d3.range(this.columns.length))
        )
        .join("g")
        .attr(
          "transform",
          ([i, j]) => `translate(${i * self.size},${j * self.size})`
        );

      cell
        .append("rect")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("x", this.padding / 2 + 0.5)
        .attr("y", this.padding / 2 + 0.5)
        .attr("width", this.size - this.padding)
        .attr("height", this.size - this.padding);

      cell.each(function ([i, j]) {
        d3.select(this)
          .selectAll("circle")
          .data(
            self.data.filter(
              (d) => !isNaN(d[self.columns[i]]) && !isNaN(d[self.columns[j]])
            )
          )
          .join("circle")
          .attr("cx", (d) => self.x[i](d[self.columns[i]]))
          .attr("cy", (d) => self.y[j](d[self.columns[j]]));
      });

      const circle = cell
        .selectAll("circle")
        .attr("r", 3.5)
        .attr("fill-opacity", 0.7)
        .attr("fill", "blue");

      cell.call(this.brush, circle);

      svg
        .append("g")
        .style("font", "bold 10px sans-serif")
        .style("pointer-events", "none")
        .selectAll("text")
        .data(this.columns)
        .join("text")
        .attr(
          "transform",
          (d, i) => `translate(${i * self.size},${i * self.size})`
        )
        .attr("x", this.padding)
        .attr("y", this.padding)
        .attr("dy", ".71em")
        .text((d) => d);

      return svg.node();
    },
    brush(cell, circle) {
      const self = this;
      const brush = d3
        .brush()
        .extent([
          [this.padding / 2, this.padding / 2],
          [this.size - this.padding / 2, this.size - this.padding / 2],
        ])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

      cell.call(brush);

      let brushCell;

      // Clear the previously-active brush, if any.
      function brushstarted() {
        if (brushCell !== this) {
          d3.select(brushCell).call(brush.move, null);
          brushCell = this;
        }
      }

      // Highlight the selected circles.
      function brushed([i, j]) {
        if (d3.event.selection === null) return;
        const [[x0, y0], [x1, y1]] = d3.event.selection;
        circle.classed("hidden", (d) => {
          return (
            x0 > self.x[i](d[self.columns[i]]) ||
            x1 < self.x[i](d[self.columns[i]]) ||
            y0 > self.y[j](d[self.columns[j]]) ||
            y1 < self.y[j](d[self.columns[j]])
          );
        });
        self.brushedSubjects = self.data
          .filter(
            (d) =>
              self.x[i](d[self.columns[i]]) >= x0 &&
              self.x[i](d[self.columns[i]]) <= x1 &&
              self.y[j](d[self.columns[j]]) >= y0 &&
              self.y[j](d[self.columns[j]]) <= y1
          )
          .map((d) => d.participant_id);
      }

      // If the brush is empty, select all circles.
      function brushended() {
        if (d3.event.selection !== null) return;
        circle.classed("hidden", false);
        self.brushedSubjects = self.data.map((d) => d.participant_id);
      }
    },
    handleResize() {
      this.width = this.$refs.chart.clientWidth;

      const svg = d3
        .select("#scattersvg")
        .attr("width", this.width - this.margin.left - this.margin.right);

      this.x.forEach((x) =>
        x.range([0, this.width - this.margin.left - this.margin.right])
      );

      const self = this;
      svg
        .selectAll("rect")
        .attr("x", function (d) {
          return self.x(d.i);
        })
        .attr("width", this.x.bandwidth());
    },
  },
};
</script>

<style scoped>
.scatterplot-matrix {
  width: 100%;
  height: 100%;
}
</style>
