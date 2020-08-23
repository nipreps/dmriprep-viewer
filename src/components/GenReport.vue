<template>
  <b-container>
    <b-container v-if="groupReport">
      <b-sidebar
        id="sidebar-backdrop"
        title="Study overview"
        backdrop-variant="dark"
        backdrop
        lazy
        shadow
        :visible="showInitialSidebar"
      >
        <explainer
          explainer-text="Select a subject below to see their report. Or select the study ID at the top to see a group summary. You can filter the subject list using the text input. You can close this sidebar by clicking on the 'x' in the top right or by simply clicking outside of the sidebar."
        ></explainer>
        <b-nav vertical pills class="w-100">
          <b-nav-item :active="showStudyQc" @click="showStudyQc = true">
            {{ groupReport.studyId ? groupReport.studyId : "Study" }}
          </b-nav-item>
          <input
            class="m-1"
            v-model="subjectFilter"
            placeholder="filter subjects"
          />
          <b-nav-item
            v-for="subject in filteredSubjects"
            :key="subject"
            :active="subject === subjectSelected"
            @click="subjectSelected = subject"
            >{{ subject }}</b-nav-item
          >
        </b-nav>
      </b-sidebar>
      <groupReport
        v-if="showStudyQc && groupReport"
        :reportProp="groupReport"
      ></groupReport>
      <report
        v-else-if="subjectSelected && subjectReports[subjectSelected]['report']"
        :reportProp="subjectReports[subjectSelected]['report']"
      ></report>
      <spinner v-else></spinner>
    </b-container>
    <spinner v-else></spinner>
  </b-container>
</template>

<script>
import axios from "axios";
import _ from "lodash";
import explainer from "./Explainer";
import groupReport from "./ReportGroup";
import report from "./ReportParticipant";
import spinner from "./Spinner";

export default {
  name: "genReport",
  components: {
    explainer,
    groupReport,
    report,
    spinner,
  },
  data() {
    return {
      url: null,
      s3Uri: null,
      files: null,
      groupFile: null,
      groupReport: null,
      subjectsBrushed: [],
      subjectReports: null,
      subjectSelected: null,
      showStudyQc: true,
      showInitialSidebar: true,
      subjectFilter: "",
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
          // Todo: update this to work with directories instead of single files
          this.url = this.$route.query.url;
          this.loadFromUrl();
        } else if (this.$route.query.s3Uri) {
          // Todo: update this to work with directories instead of single files
          this.s3Uri = this.$route.query.s3Uri;
          this.loadFromS3();
        }
      }
    },
    loadFromUrl() {
      // Todo: update this to work with directories instead of single files
      axios.get(this.url).then((resp) => {
        this.report = resp.data;
      });
    },
    loadFromS3() {
      // Todo: update this to work with directories instead of single files
      axios.get(`https://s3.amazonaws.com/$(this.s3Uri`).then((resp) => {
        this.report = resp.data;
      });
    },
    getFileDepth(file) {
      return file.webkitRelativePath.split("/").length;
    },
    selectRootGroupFile() {
      // if there are multiple group files, select the one closest to the root directory
      if (this.groupFile.length === 1) {
        this.groupFile = this.groupFile[0];
      } else {
        const groupedFiles = _.groupBy(this.groupFile, this.getFileDepth);
        const smallest = Math.min(...Object.keys(groupedFiles));
        const rootJsonFiles = groupedFiles[smallest];
        if (rootJsonFiles.length === 1) {
          this.groupFile = rootJsonFiles[0];
        } else {
          this.groupFile = null;
        }
      }
    },
    readJsonFile(inputFile) {
      const tempFileReader = new FileReader();

      return new Promise((resolve, reject) => {
        tempFileReader.onerror = () => {
          tempFileReader.abort();
          reject(new DOMException("Problem parsing input file."));
        };

        tempFileReader.onload = () => {
          resolve({
            file: inputFile,
            content: JSON.parse(tempFileReader.result),
          });
        };
        tempFileReader.readAsText(inputFile);
      });
    },
    async initSubjectReports(participantFileMap) {
      const reports = await _.reduce(
        Object.keys(participantFileMap),
        (o, k) => (
          (o[k] = {
            source: participantFileMap[k],
            sourceType: "file",
            report: null,
            whenRequested: null,
          }),
          o
        ),
        {}
      );
      return reports;
    },
    async getAllReportsFromFiles(jsonFiles) {
      const reports = await _.reduce(
        jsonFiles,
        (o, k) => (
          (o[this.readJsonFile(k)["subject_id"]] = this.readJsonFile(k)), o
        ),
        {}
      );
      return reports;
    },
    async loadGroupReport() {
      const gr = await this.readJsonFile(this.groupFile);
      this.groupReport = gr["content"];
    },
    async updateSubjectReports(subject_id) {
      let sr = this.subjectReports[subject_id];
      if (sr["report"] == null) {
        // use the abstract equality operator to test for both null and undefined
        if (sr["sourceType"] === "file") {
          const report = await this.readJsonFile(sr["source"]);
          sr["report"] = report["content"];
        } else if (sr["sourceType"] === "s3") {
          console.log("S3 sources are currently not supported.");
        } else if (sr["sourceType"] === "url") {
          console.log("URL sources are currently not supported.");
        }
      }
      sr["whenRequested"] = new Date();
    },
  },
  created() {
    this.loadFromQuery();
  },
  mounted() {
    if (this.filesProp) {
      this.files = this.filesProp;
    }
    if (this.groupFileProp) {
      this.groupFile = this.groupFileProp;
      this.selectRootGroupFile();
      this.loadGroupReport();
    }
  },
  computed: {
    filteredSubjects() {
      if (this.subjectFilter) {
        return this.subjectsAll.filter((s) => s.includes(this.subjectFilter));
      } else {
        return this.subjectsAll;
      }
    },
    subjectsInGroupReport: function () {
      if (this.groupReport) {
        return this.groupReport.subjects.map((o) => o["participant_id"]);
      } else {
        return [];
      }
    },
    subjectFileMap: function () {
      if (this.files) {
        const re = /sub-[a-z0-9]+/gi;
        return _.reduce(
          this.files,
          (o, k) => ((o[[...new Set(k.name.match(re))][0]] = k), o),
          {}
        );
      } else {
        return {};
      }
    },
    subjectsAll: function () {
      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return [
        ...new Set(
          Object.keys(this.subjectFileMap).concat(this.subjectsInGroupReport)
        ),
      ].sort(collator.compare);
    },
  },
  watch: {
    filesProp: {
      deep: true,
      immediate: true,
      handler: function () {
        if (this.filesProp) {
          this.files = this.filesProp;
        }
      },
    },
    groupFileProp: {
      deep: true,
      immediate: true,
      handler: function () {
        if (this.groupFileProp) {
          this.groupFile = this.groupFileProp;
          this.selectRootGroupFile();
          this.loadGroupReport();
        }
      },
    },
    urlProp: {
      handler: function () {
        if (this.urlProp) {
          this.url = this.urlProp;
          this.loadFromUrl();
        }
      },
    },
    s3UriProp: {
      handler: function () {
        if (this.s3UriProp) {
          this.s3Uri = this.s3UriProp;
          this.loadFromS3();
        }
      },
    },
    $route: "loadFromQuery",
    showStudyQc: {
      handler: function () {
        if (this.showStudyQc) {
          this.subjectSelected = null;
        }
      },
    },
    subjectSelected: {
      handler: function () {
        if (this.subjectSelected) {
          this.showStudyQc = false;
          this.updateSubjectReports(this.subjectSelected);
        }
      },
    },
    subjectFileMap: {
      deep: true,
      immediate: true,
      handler: async function () {
        this.subjectReports = await this.initSubjectReports(
          this.subjectFileMap
        );
      },
    },
  },
  props: {
    filesProp: Array,
    groupFileProp: Array,
    urlProp: String,
    s3UriProp: String,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
