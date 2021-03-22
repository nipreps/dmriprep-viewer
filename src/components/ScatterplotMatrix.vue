<template>
  <div id="scatterdiv">
    <!-- <resize-observer @notify="handleResize" /> -->
    <svg id="scattersvg" ref="chart" class="scatterplot-matrix"></svg>
  </div>
</template>

<script>
const d3 = require("d3");

export default {
  name: "ScatterplotMatrix",
  props: {
    dataProp: {
      type: Array,
    },
    metricsProp: {
      type: Array,
    },
  },
  data() {
    return {
      margin: { top: 10, right: 10, bottom: 10, left: 20 },
      maxWidth: 650,
      width: null,
      padding: 20,
      radius: 4,
      brushedSubjects: null,
      metrics: [],
      data: [],
      mounted: false,
    };
  },
  computed: {
    height() {
      if (this.metrics.length) {
        return this.width; // + this.padding;
      } else {
        return 0;
      }
    },
    size() {
      return (
        (this.width - (this.columns.length + 1) * this.padding) /
          this.columns.length +
        this.padding
      );
    },
    columns() {
      const that = this;
      return Object.keys(this.data[0]).filter(
        (d) => that.metrics.includes(d) && typeof that.data[0][d] === "number"
      );
    },
    yAxis() {
      const axis = d3
        .axisLeft()
        .ticks(6)
        .tickSize(-this.size * this.columns.length);
      const that = this;
      return (g) =>
        g
          .selectAll("g")
          .data(this.y)
          .join("g")
          .attr("transform", (d, i) => `translate(0,${i * that.size})`)
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
      const that = this;
      return (g) =>
        g
          .selectAll("g")
          .data(this.x)
          .join("g")
          .attr("transform", (d, i) => `translate(${i * that.size},0)`)
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
      const that = this;
      return this.x.map((x) =>
        x
          .copy()
          .range([that.size - paddingPlusMargin / 2, paddingPlusMargin / 2])
      );
    },
  },
  watch: {
    brushedSubjects: {
      deep: true,
      handler: function () {
        this.$emit("updateBrushedSubjects", {
          metric: "scatterplotMatrix",
          brushed: this.brushedSubjects,
        });
      },
    },
    metricsProp: {
      deep: true,
      immediate: true,
      handler: function () {
        if (this.metricsProp) {
          this.metrics = this.metricsProp;
          if (this.mounted) {
            this.createChart();
          }
        }
      },
    },
    dataProp: {
      deep: true,
      immediate: true,
      handler: function () {
        if (this.dataProp) {
          this.data = this.dataProp;
        }
      },
    },
  },
  mounted() {
    this.width = Math.min(this.$refs.chart.clientWidth, this.maxWidth);
    this.brushedSubjects = this.data.map((d) => d.subject_session_id);
    this.createChart();
    this.mounted = true;
  },
  methods: {
    createChart() {
      // Extend d3.selection to change z-order
      // https://github.com/wbkd/d3-extended
      d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
          this.parentNode.appendChild(this);
        });
      };
      d3.selection.prototype.moveToBack = function () {
        return this.each(function () {
          var firstChild = this.parentNode.firstChild;
          if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
          }
        });
      };

      d3.select("#scatterdiv")
        .append("div")
        .attr("id", "scattertooltip")
        .attr(
          "style",
          "position: absolute; background-color: white; display: none; padding: 2px; border: 1px solid black; border-radius: 5px;"
        );

      // Remove old chart
      d3.selectAll("#scattersvg > *").remove();

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
        .text(
          `circle.hidden { fill: #000; fill-opacity: 1; r: ${
            this.radius / 3
          }; }`
        );

      svg.append("g").call(this.xAxis);

      svg.append("g").call(this.yAxis);

      const that = this;
      const cell = svg
        .append("g")
        .selectAll("g")
        .data(
          d3.cross(d3.range(this.columns.length), d3.range(this.columns.length))
        )
        .join("g")
        .attr(
          "transform",
          ([i, j]) => `translate(${i * that.size},${j * that.size})`
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
            that.data.filter(
              (d) => !isNaN(d[that.columns[i]]) && !isNaN(d[that.columns[j]])
            )
          )
          .join("circle")
          .attr("cx", (d) => that.x[i](d[that.columns[i]]))
          .attr("cy", (d) => that.y[j](d[that.columns[j]]));
      });

      cell.call(this.brush);

      const circle = cell
        .selectAll("circle")
        .attr("r", this.radius)
        .attr("fill-opacity", 0.7)
        .attr("fill", "blue")
        .style("cursor", "pointer")
        .on("mouseover", (d) => {
          d3.select(d3.event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", that.radius * 2);

          d3.select("#scattertooltip")
            .transition()
            .duration(200)
            .style("display", "initial")
            .text(d.subject_session_id);
        })
        .on("mouseout", () => {
          d3.select(d3.event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", that.radius);

          d3.select("#scattertooltip").style("display", "none");
        })
        .on("mousemove", () => {
          d3.select("#scattertooltip")
            .style("left", d3.event.pageX + 10 + "px")
            .style("top", d3.event.pageY + 10 + "px");
        })
        .on("click", (d) => {
          that.$emit("updateSelectedSubject", d.subject_session_id);
        });

      circle.moveToFront();

      svg
        .append("g")
        .style("font", "bold 10px sans-serif")
        .style("pointer-events", "none")
        .selectAll("text")
        .data(this.columns)
        .join("text")
        .attr(
          "transform",
          (d, i) => `translate(${i * that.size},${i * that.size})`
        )
        .attr("x", this.padding)
        .attr("y", this.padding)
        .attr("dy", ".71em")
        .attr("font-size", "1.5em")
        .text((d) => d);

      return svg.node();
    },
    brush(cell) {
      const circle = cell.selectAll("circle");
      const that = this;
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
            x0 > that.x[i](d[that.columns[i]]) ||
            x1 < that.x[i](d[that.columns[i]]) ||
            y0 > that.y[j](d[that.columns[j]]) ||
            y1 < that.y[j](d[that.columns[j]])
          );
        });
        that.brushedSubjects = that.data
          .filter(
            (d) =>
              that.x[i](d[that.columns[i]]) >= x0 &&
              that.x[i](d[that.columns[i]]) <= x1 &&
              that.y[j](d[that.columns[j]]) >= y0 &&
              that.y[j](d[that.columns[j]]) <= y1
          )
          .map((d) => d.subject_session_id);
      }

      // If the brush is empty, select all circles.
      function brushended() {
        if (d3.event.selection !== null) return;
        circle.classed("hidden", false);
        that.brushedSubjects = that.data.map((d) => d.subject_session_id);
      }
    },
    handleResize() {
      this.width = Math.min(
        this.$refs.chart.clientWidth,
        this.$refs.chart.clientHeight
      );

      const svg = d3
        .select("#scattersvg")
        .attr("width", this.width - this.margin.left - this.margin.right);

      this.x.forEach((x) =>
        x.range([0, this.width - this.margin.left - this.margin.right])
      );

      const that = this;
      svg
        .selectAll("rect")
        .attr("x", function (d) {
          return that.x(d.i);
        })
        .attr("width", this.x.bandwidth());
    },
  },
};
</script>

<style scoped>
.scatterplot-matrix {
  width: 100%;
  /* height: 100%; */
}
</style>
