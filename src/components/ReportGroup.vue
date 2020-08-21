<template>
  <b-container>
    <b-container v-if="groupReport">
      <topBar :reportProp="groupReport" sidebarOn></topBar>
      Loading group report
    </b-container>
    <spinner v-else></spinner>
  </b-container>
</template>

<script>
import spinner from "./Spinner";
import topBar from "./TopBar";

export default {
  name: "groupReport",
  components: {
    spinner,
    topBar,
  },
  data() {
    return {
      groupReport: null,
      allSubjects: null,
      brushedSubjects: null,
    };
  },
  props: {
    reportProp: {
      type: Object,
    },
  },
  mounted() {
    if (this.reportProp) {
      this.groupReport = this.reportProp;
    }
  },
  watch: {
    reportProp() {
      if (this.reportProp) {
        this.groupReport = this.reportProp;
      }
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
