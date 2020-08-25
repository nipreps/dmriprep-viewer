<template>
  <b-container fluid class="px-0">
    <b-container fluid class="px-0" v-if="groupReport">
      <topBar :reportProp="groupReport" sidebarOn></topBar>

      <explainer explainer-text="Todo: explain this"></explainer>

      <b-form-group class="text-left" label="Select scatterplot metrics">
        <b-form-checkbox-group
          id="checkbox-group-scatter"
          v-model="scatterMetrics"
          :options="metricOptions"
          name="scatter-metrics"
        ></b-form-checkbox-group>
      </b-form-group>

      <scatterplotMatrix
        :dataProp="groupReport['subjects']"
        :metricsProp="scatterMetrics"
        v-on:updateBrushedSubjects="updateBrushedSubjects"
      ></scatterplotMatrix>

      <b-form-group class="text-left" label="Select violin plot metrics">
        <b-form-checkbox-group
          id="checkbox-group-violin"
          v-model="violinMetrics"
          :options="metricOptions"
          name="violin-metrics"
        ></b-form-checkbox-group>
      </b-form-group>

      <violinPlot
        v-for="metric in violinMetrics"
        :key="metric"
        :data="groupReport['subjects']"
        :metric="metric"
        v-on:updateBrushedSubjects="updateBrushedSubjects"
      ></violinPlot>

      <b-card
        class="text-left p-0 mb-5 mt-2"
        footer="This list scrolls left/right. Click on a participant ID to go to their report."
      >
        <template v-slot:header>
          <b-row class="d-flex align-items-center">
            <b-col cols="7" class="text-left">
              <h5 class="m-0">
                Selected subjects: {{ brushedSubjectsIntersection.length }}
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
              v-for="subject in brushedSubjectsIntersection"
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
import violinPlot from "./ViolinPlot";

export default {
  name: "groupReport",
  components: {
    explainer,
    scatterplotMatrix,
    spinner,
    topBar,
    violinPlot,
  },
  data() {
    return {
      groupReport: null,
      brushedSubjects: {},
      brushedSubjectsIntersection: [],
      scatterMetrics: [],
      violinMetrics: [],
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
    // Todo: Find some way to sensibly initialize these next two lines
    this.scatterMetrics = this.metricOptions.slice(0, 3);
    this.violinMetrics = this.metricOptions.slice(3);
    this.brushedSubjects = this.metricOptions.reduce(
      (o, key) => ({
        ...o,
        [key]: this.groupReport.subjects.map((d) => d.participant_id),
      }),
      {}
    );
    this.brushedSubjects.scatterplotMatrix = this.groupReport.subjects.map(
      (d) => d.participant_id
    );
  },
  methods: {
    updateBrushedSubjects(brushedSubjectData) {
      this.brushedSubjects[brushedSubjectData.metric] =
        brushedSubjectData.brushed;

      this.brushedSubjectsIntersection = Object.values(
        this.brushedSubjects
      ).reduce(
        (accumulator, currentValue) =>
          accumulator.filter((d) => currentValue.includes(d)),
        this.groupReport.subjects.map((d) => d.participant_id)
      );
    },
    updateSelectedSubject(subject) {
      this.$emit("subjectSelected", subject);
    },
    copyBrushedSubjectsToClipboard() {
      navigator.clipboard.writeText(this.brushedSubjects.join());
    },
  },
  computed: {
    metricOptions() {
      return Object.keys(this.groupReport.subjects[0])
        .filter((k) => k !== "participant_id")
        .sort();
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
