<template>
  <b-container>
    <b-container v-if="groupReport">
      <topBar :reportProp="groupReport" sidebarOn></topBar>
      <explainer explainer-text="Todo: explain this"></explainer>
      <b-form-group label="select scatterplot metrics">
        <b-form-checkbox-group
          id="checkbox-group-1"
          v-model="scatterMetrics"
          :options="scatterOptions"
          name="flavour-1"
        ></b-form-checkbox-group>
      </b-form-group>
      <scatterplotMatrix
        :data="groupReport['subjects']"
        :metrics="scatterMetrics"
        v-on:updateBrushedSubjects="updateBrushedSubjects"
      ></scatterplotMatrix>
      <div class="text-left">
        <b-form-group
          class="mb-0"
          label="Selected subjects:"
          label-for="brushed-subject-textarea"
          description="this list is scrollable"
        >
          <b-form-textarea
            id="brushed-subject-textarea"
            readonly
            :value="brushedSubjectText"
            no-resize
            rows="8"
            max-rows="8"
          ></b-form-textarea>
        </b-form-group>
      </div>
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
  },
  computed: {
    scatterOptions() {
      return Object.keys(this.groupReport.subjects[0]).filter(
        (k) => k !== "participant_id"
      );
    },
    brushedSubjectText() {
      return this.brushedSubjects.join("\n");
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
</style>
