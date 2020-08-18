<template>
  <b-container v-if="report">
    <report :reportProp="report"></report>
  </b-container>
</template>

<script>
import axios from "axios";
import report from "./ReportParticipant";

export default {
  name: "genReport",
  components: {
    report,
  },
  data() {
    return {
      report: null,
      reportSource: null,
    };
  },
  methods: {
    loadFromQuery() {
      if (this.$route.query) {
        // load the json
        if (
          !(this.$route.query.url || this.$route.query.s3Uri) &&
          this.$route.name === "GenReport"
        ) {
          this.$router.push("/");
        } else if (this.$route.query.url) {
          axios.get(this.$route.query.url).then((resp) => {
            this.report = resp.data;
          });
        } else if (this.$route.query.s3Uri) {
          axios
            .get(`https://s3.amazonaws.com/$(this.$route.query.s3Uri`)
            .then((resp) => {
              this.report = resp.data;
            });
        }
      }
    },
  },
  created() {
    this.loadFromQuery();
  },
  mounted() {
    if (this.reportProp) {
      this.report = this.reportProp;
    }
  },
  watch: {
    reportProp() {
      if (this.reportProp) {
        this.report = this.reportProp;
      }
    },
    $route() {
      this.loadFromQuery();
    },
  },
  props: {
    reportProp: Object,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
