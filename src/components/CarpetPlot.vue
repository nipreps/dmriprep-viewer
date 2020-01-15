<template>
  <div>
    <resize-observer @notify="handleResize" />
    <svg id="carpetsvg" ref="chart" class="carpetplot"></svg>
  </div>
</template>

<script>

const d3 = require('d3')

export default {
  name: 'Carpetplot',
  props: {
    data: {
      type: Array,
    },
    highlightIdx: {
      type: Number,
    }
  },
  data() {
    return {
      margin: {top: 10, right: 25, bottom: 10, left: 40},
      mounted: false,
      width: null,
      height: 500,
      x: null, 
      y: null,
    }
  },
  computed: {
    dataFlattened() {
      const nRows = this.data.length
      const nCols = this.data[0].length
      const output = []

      for (let i=0; i<nRows; i+= 1) {
        for (let j=0; j<nCols; j+= 1) {
          output.push({i, j, value: this.data[i][j]})
        }
      }
      return output
    },
  },
  watch: {
    highlightIdx() {
      const self = this
      d3.select("#carpetsvg")
        .selectAll('rect')
        .style("opacity", function(d) {
          if (d.i == self.highlightIdx) {
            return 1
          }
          return 0.5
        })
    }
  },
  mounted() {
    this.mounted = true
    this.width = this.$refs.chart.clientWidth
    this.init()
  },
  methods: {
    init() {

      const width = this.width - this.margin.left - this.margin.right
      const height = 450 - this.margin.top - this.margin.bottom;

      // append the svg object to the body of the page
      const svg = d3.select("#carpetsvg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform",
              "translate(" + this.margin.left + "," + this.margin.top + ")");
      
      const myGroups = d3.map(this.dataFlattened, function(d){return d.i;}).keys()
      const myVars = d3.map(this.dataFlattened, function(d){return d.j;}).keys()


      // Build X scales and axis:
      const x = d3.scaleBand()
        .range([ 0, width ])
        .domain(myGroups)
        .padding(0.05);


      this.x = x

      // Build Y scales and axis:
      const y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(myVars)
        .padding(0.05);


      this.y = y


      // Build color scale

      // const maxVal = d3.max(this.dataFlattened, d => d.value)
      // const minVal = d3.min(this.dataFlattened, d => d.value)

      const myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        // .domain([minVal, maxVal])
        .domain([0, 1])

      // const mouseover = function() {
      //   d3.select(this)
      //     .style("stroke", "black")
      //     .style("opacity", 1)
      // }

      // const mouseleave = function() {
      //   d3.select(this)
      //     .style("stroke", "none")
      //     .style("opacity", 0.8)
      // }

      const self = this;

      svg.selectAll()
        .data(this.dataFlattened, function(d) {return d.i+':'+d.j;})
        .enter()
        .append("rect")
          .attr("x", function(d) { return x(d.i) })
          .attr("y", function(d) { return y(d.j) })
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("width", x.bandwidth() )
          .attr("height", y.bandwidth() )
          .style("fill", function(d) { return myColor(d.value)} )
          .style("stroke-width", 4)
          .style("stroke", "none")
          .style("opacity", function(d) {
            if (d.i == self.highlightIdx) {
              return 1
            }
            return 0.5
          })
        //  .on("mouseover", mouseover)
        // .on("mousemove", mousemove)
        //  .on("mouseleave", mouseleave)

    },
    handleResize() {
      this.width = this.$refs.chart.clientWidth
      
      const svg = d3.select("#carpetsvg")
        .attr("width", this.width - this.margin.left - this.margin.right)

      this.x.range([ 0, this.width - this.margin.left - this.margin.right ])
      const self = this
      svg.selectAll('rect')
         .attr("x", function(d) { return self.x(d.i) })
         .attr("width", this.x.bandwidth() )
    }
  },
}
</script>

<style>
  .carpetplot {
    width: 100%;
    height: 100%;
  }
</style>