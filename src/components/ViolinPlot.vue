<template>
  <div>
    <!-- <resize-observer @notify="handleResize" /> -->
    <svg :id="svgId" ref="chart" class="violin-plot"></svg>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "violinPlot",
  props: {
    data: {
      type: Array,
    },
    metric: {
      type: String,
    },
  },
  data() {
    return {
      margin: { top: 10, right: 10, bottom: 20, left: 10 },
      width: null,
      height: 250,
      radius: 5,
      brushedSubjects: null,
      histogram: null,
      bins: null,
      maxNum: null,
      yNum: null,
    };
  },
  computed: {
    boxHeight() {
      return this.height / 6;
    },
    center() {
      return this.height / 2 - this.margin.bottom;
    },
    padding() {
      return this.radius * 0.1;
    },
    svgId() {
      return "violinsvg-" + this.metric;
    },
    x() {
      return d3
        .scaleLinear()
        .domain(d3.extent(this.data, (d) => d[this.metric]))
        .range([this.margin.left, this.width - this.margin.right]);
    },
    dodgedData() {
      return this.dodge(this.data, this.radius * 2 + this.padding);
    },
    boxPlotInfo() {
      const sorted = this.data.map((d) => d[this.metric]).sort(d3.ascending);
      const q1 = d3.quantile(sorted, 0.25);
      const median = d3.quantile(sorted, 0.5);
      const q3 = d3.quantile(sorted, 0.75);
      const interQuantileRange = q3 - q1;
      return {
        q1: q1,
        median: median,
        q3: q3,
        interQuantileRange: interQuantileRange,
        min: q1 - 1.5 * interQuantileRange,
        max: q1 + 1.5 * interQuantileRange,
      };
    },
  },
  watch: {
    brushedSubjects: {
      deep: true,
      handler: function () {
        this.$emit("updateBrushedSubjects", {
          metric: this.metric,
          brushed: this.brushedSubjects,
        });
      },
    },
  },
  mounted() {
    this.width = this.$refs.chart.clientWidth;
    this.brushedSubjects = this.data.map((d) => d.participant_id);

    let highestPoint = this.getHighestPoint();
    while (highestPoint < this.margin.top) {
      console.log("Changing radius");
      this.radius = this.radius - 0.1;
      if (this.radius < 3) {
        this.radius = 5;
        this.height = this.height + 50;
      }
      highestPoint = this.getHighestPoint();
    }
    this.createChart();
  },
  methods: {
    getHighestPoint() {
      return (
        this.height -
        this.boxHeight -
        this.margin.bottom -
        this.margin.top -
        this.radius -
        this.padding -
        Math.max(...this.dodgedData.map((d) => d.y))
      );
    },
    dodge(data, radius) {
      const radius2 = radius ** 2;
      const circles = data
        .map((d) => ({ x: this.x(d[this.metric]), data: d }))
        .sort((a, b) => a.x - b.x);
      const epsilon = 1e-3;
      let head = null,
        tail = null;

      // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
      function intersects(x, y) {
        let a = head;
        while (a) {
          if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
            return true;
          }
          a = a.next;
        }
        return false;
      }

      // Place each circle sequentially.
      for (const b of circles) {
        // Remove circles from the queue that can’t intersect the new circle b.
        while (head && head.x < b.x - radius2) head = head.next;
        // Choose the minimum non-intersecting tangent.
        if (intersects(b.x, (b.y = 0))) {
          let a = head;
          b.y = Infinity;
          do {
            let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
            if (y < b.y && !intersects(b.x, y)) b.y = y;
            a = a.next;
          } while (a);
        }

        // Add b to the queue.
        b.next = null;
        if (head === null) head = tail = b;
        else tail = tail.next = b;
      }

      return circles;
    },
    createChart() {
      var svg = d3
        .select("#" + this.svgId)
        .attr("viewBox", [0, 0, this.width, this.height]);

      svg
        .append("style")
        .text(
          `circle.hidden { fill: #000; fill-opacity: 1; r: ${
            this.radius / 2
          }; }`
        );

      const that = this;
      const x = this.x;

      const xAxis = (g) =>
        g
          .attr("transform", `translate(0,${that.height - that.margin.bottom})`)
          .call(d3.axisBottom(x).tickSizeOuter(0));

      svg.append("g").call(xAxis);

      // Color scale for dots
      const myColor = d3
        .scaleSequential()
        .interpolator(d3.interpolateCool)
        .domain(x.domain());

      // Add individual points with jitter
      svg
        .append("g")
        .selectAll("circle")
        .data(this.dodgedData)
        .join("circle")
        .attr("cx", (d) => d.x)
        .attr(
          "cy",
          (d) =>
            that.height -
            that.boxHeight -
            that.margin.bottom -
            that.margin.top -
            that.radius -
            that.padding -
            d.y
        )
        .attr("r", this.radius)
        .style("fill", (d) => myColor(d.data[that.metric]))
        .attr("stroke", "white");

      svg
        .append("text")
        .attr("x", this.margin.left * 2)
        .attr("y", this.margin.top * 2)
        .attr("font-weight", "bold")
        .text(this.metric);

      // Box plot
      svg
        .append("line")
        .attr("x1", x(this.boxPlotInfo.min))
        .attr("x2", x(this.boxPlotInfo.max))
        .attr(
          "y1",
          this.height -
            this.margin.bottom -
            this.padding -
            this.radius -
            this.boxHeight / 2
        )
        .attr(
          "y2",
          this.height -
            this.margin.bottom -
            this.padding -
            this.radius -
            this.boxHeight / 2
        )
        .attr("stroke", "black")
        .attr("stroke-width", 2);

      // Show the box
      svg
        .append("rect")
        .attr(
          "y",
          this.height -
            this.margin.bottom -
            this.boxHeight -
            this.padding -
            this.radius
        )
        .attr("x", x(this.boxPlotInfo.q1))
        .attr("width", x(this.boxPlotInfo.q3) - x(this.boxPlotInfo.q1))
        .attr("height", this.boxHeight)
        .attr("stroke", "none")
        .style("fill", "grey");

      // show median, min and max horizontal lines
      svg
        .selectAll("toto")
        .data([
          this.boxPlotInfo.min,
          this.boxPlotInfo.median,
          this.boxPlotInfo.max,
        ])
        .enter()
        .append("line")
        .attr(
          "y1",
          this.height -
            this.margin.bottom -
            this.boxHeight -
            this.padding -
            this.radius
        )
        .attr(
          "y2",
          this.height - this.margin.bottom - this.padding - this.radius
        )
        .attr("x1", function (d) {
          return x(d);
        })
        .attr("x2", function (d) {
          return x(d);
        })
        .attr("stroke", "black")
        .attr("stroke-width", 2);

      const circle = d3.selectAll("#" + this.svgId + " circle");
      svg.call(this.brush, circle);
    },
    brush(svg, circle) {
      const that = this;
      const brush = d3
        .brushX()
        .extent([
          [this.margin.left, this.margin.top],
          [this.width - this.margin.right, this.height - this.margin.bottom],
        ])
        .on("brush", brushed)
        .on("end", brushended);

      svg.call(brush);

      // Highlight the selected circles.
      function brushed() {
        if (d3.event.selection === null) return;
        const [x0, x1] = d3.event.selection;
        circle.classed("hidden", (d) => {
          return x0 > d.x || x1 < d.x;
        });
        that.brushedSubjects = that.data
          .filter(
            (d) => that.x(d[that.metric]) >= x0 && that.x(d[that.metric]) <= x1
          )
          .map((d) => d.participant_id);
      }

      // If the brush is empty, select all circles.
      function brushended() {
        if (d3.event.selection !== null) return;
        circle.classed("hidden", false);
        that.brushedSubjects = that.data.map((d) => d.participant_id);
      }
    },
    // handleResize() {
    //   this.width = this.$refs.chart.clientWidth;

    //   const svg = d3
    //     .select("#" + this.svgId)
    //     .attr("width", this.width - this.margin.left - this.margin.right);

    //   this.x.range([0, this.width - this.margin.left - this.margin.right]);
    //   const that = this;
    //   svg
    //     .selectAll("rect")
    //     .attr("x", function (d) {
    //       return that.x(d.i);
    //     })
    //     .attr("width", this.x.bandwidth());
    // },
  },
};
</script>

<style scoped>
.violin-plot {
  width: 100%;
  height: 100%;
}
</style>
