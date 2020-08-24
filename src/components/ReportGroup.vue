<template>
  <b-container>
    <b-container v-if="groupReport">
      <topBar :reportProp="groupReport" sidebarOn></topBar>
      <explainer explainer-text="Todo: explain this"></explainer>
      <b-form-group class="text-left" label="Select scatterplot metrics">
        <b-form-checkbox-group
          id="checkbox-group-1"
          v-model="scatterMetrics"
          :options="scatterOptions"
          name="scatter-metrics"
        ></b-form-checkbox-group>
      </b-form-group>
      <scatterplotMatrix
        :dataProp="groupReport['subjects']"
        :metricsProp="scatterMetrics"
        v-on:updateBrushedSubjects="updateBrushedSubjects"
      ></scatterplotMatrix>
      <b-card
        class="text-left p-0 mb-5"
        footer="This list scrolls left/right. Click on a participant ID to go to their report."
      >
        <template v-slot:header>
          <b-row class="d-flex align-items-center">
            <b-col cols="7" class="text-left">
              <h5 class="m-0">
                Selected subjects: {{ brushedSubjects.length }}
              </h5>
            </b-col>
            <b-col cols="5" class="text-right">
              <b-button
                @click="copyBrushedSubjectsToClipboard()"
                id="clipboard-button"
                variant="outline-primary"
                class="m-0"
              >
                <b-icon
                  icon="clipboard"
                  class="p m-0"
                  aria-hidden="true"
                ></b-icon>
              </b-button>
              <b-tooltip target="clipboard-button" triggers="hover"
                >copy subject list to clipboard</b-tooltip
              >
            </b-col>
          </b-row>
        </template>
        <b-card-text>
          <b-nav vertical class="pb-0 text-left brushed-subject-nav">
            <b-nav-item
              v-for="subject in brushedSubjects"
              :key="subject"
              @click="updateSelectedSubject(subject)"
              >{{ subject }}</b-nav-item
            >
          </b-nav>
        </b-card-text>
      </b-card>
    </b-container>
    <spinner v-else></spinner>
  </b-container>
</template>

<script>
import explainer from "./Explainer";
import scatterplotMatrix from "./ScatterplotMatrix";
import spinner from "./Spinner";
import topBar from "./TopBar";

export default {
  name: "groupReport",
  components: {
    explainer,
    scatterplotMatrix,
    spinner,
    topBar,
  },
  data() {
    return {
      groupReport: null,
      allSubjects: null,
      brushedSubjects: [],
      scatterMetrics: [],
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
    this.scatterMetrics = this.scatterOptions.slice(0, 3);
  },
  methods: {
    updateBrushedSubjects(brushedSubjects) {
      this.brushedSubjects = brushedSubjects;
    },
    updateSelectedSubject(subject) {
      this.$emit("subjectSelected", subject);
    },
    copyBrushedSubjectsToClipboard() {
      navigator.clipboard.writeText(this.brushedSubjects.join());
    },
  },
  computed: {
    scatterOptions() {
      return Object.keys(this.groupReport.subjects[0]).filter(
        (k) => k !== "participant_id"
      );
    },
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
.brushed-subject-nav {
  overflow: scroll;
  height: 100px;
}
</style>
