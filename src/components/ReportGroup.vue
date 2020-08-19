<template>
  <b-container>
    <b-container v-if="!report" class="text-center">
      <strong>Loading...</strong>
      <b-spinner
        class="ml-2"
        variant="primary"
        label="loading report"
      ></b-spinner>
    </b-container>
    <b-container v-if="groupReport">
      <b-sidebar
        id="sidebar-backdrop"
        title="Select a subject"
        backdrop-variant="dark"
        backdrop
        lazy
        shadow
      >
        <div class="text-left m-3">
          or select the study-ID at the top to view summary QC metrics.
        </div>
        <b-nav vertical pills class="w-100">
          <b-nav-item :active="showStudyQc" @click="showStudyQc = true">{{
            groupReport.studyId ? groupReport.studyId : "Study"
          }}</b-nav-item>
          <b-nav-item
            v-for="subject in brushedSubjects"
            :key="subject"
            :active="subject === subjectSelected"
            @click="subjectSelected = subject"
            >{{ subject }}</b-nav-item
          >
        </b-nav>
      </b-sidebar>
      <div v-if="showStudyQc">
        <topBar :reportProp="groupReport" sidebarButton></topBar>
      </div>
      <div v-if="subjectSelected">Bar</div>
      <!-- <report v-if="subjectSelected" :reportProp="participantReport" sidebarButton></report> -->
    </b-container>
  </b-container>
</template>

<script>
// import report from "./ReportParticipant";
import topBar from "./TopBar";

export default {
  name: "groupReport",
  components: {
    topBar,
    // report,
  },
  data() {
    return {
      groupReport: null,
      participantReport: null,
      showStudyQc: true,
      subjectSelected: null,
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
      this.allSubjects = Object.keys(this.groupReport.subject_reports);
      this.brushedSubjects = Object.keys(this.groupReport.subject_reports);
    }
  },
  watch: {
    reportProp() {
      if (this.reportProp) {
        this.groupReport = this.reportProp;
      }
    },
    showStudyQc() {
      if (this.showStudyQc) {
        this.subjectSelected = null;
        this.participantReport = null;
      }
    },
    subjectSelected() {
      if (this.subjectSelected) {
        this.showStudyQc = false;
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
