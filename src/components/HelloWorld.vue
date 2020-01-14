<template>
  <b-container>

      <report :report="report"></report>
  </b-container>
</template>

<script>
import report from './ReportStandalone';

const reportFile = require('../../example/report.json')


export default {
  name: 'Main',
  components: {
    report,
  },
  data() {
    return {
      report: reportFile,
    };
  },
  methods: {
    get_mid_slice() {
      return Math.floor(this.report.b0.num_slices / 2);
    },
  },
  watch: {

  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

h1, h2 {
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
