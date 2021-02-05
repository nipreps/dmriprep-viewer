<template>
  <b-container fluid class="px-0 m-3">
    <b-container fluid class="px-0" v-if="groupReport">
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
          <b-nav-item class="mx-1" :active="showStudyQc" @click="showStudyQc = true">
            {{ groupReport.studyId ? groupReport.studyId : "Study" }}
          </b-nav-item>
          <input
            class="m-1"
            v-model="subjectFilter"
            placeholder="filter subjects"
          />
          <b-nav-item
            class="mx-1"
            v-for="subject in filteredSubjects"
            :key="subject"
            :active="subject === subjectSelected"
            @click="subjectSelected = subject"
          >
            <b-icon
              class="mr-2"
              align-self="end"
              icon="check-circle-fill"
              scale="0.9"
              variant="success"
              v-if="subjectRatings[subject].reviewed"
            ></b-icon>
            <b-icon
              class="mr-2"
              icon="circle"
              scale="0.5"
              variant="secondary"
              v-else
            ></b-icon>
            {{ subject }}
          </b-nav-item>
        </b-nav>
      </b-sidebar>
      <groupReport
        v-if="showStudyQc && groupReport"
        v-on:subjectSelected="updateSelectedSubject"
        v-on:ratingsDownloadRequested="downloadRatings"
        :reportProp="groupReport"
      ></groupReport>
      <report
        v-else-if="subjectSelected && subjectReports[subjectSelected]['report']"
        :reportProp="subjectReports[subjectSelected]['report']"
        :ratingProp="subjectRatings[subjectSelected]"
        v-on:ratingsDownloadRequested="downloadRatings"
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
      bucket: null,
      files: null,
      groupFile: null,
      groupReport: null,
      manifestEntries: [],
      re: /sub-[a-z0-9]+/gi,
      s3Prefix: null,
      s3Uri: null,
      showInitialSidebar: true,
      showStudyQc: true,
      sourceType: null,
      subjectFilter: "",
      subjectReports: null,
      subjectRatings: null,
      subjectSelected: null,
      subjectsBrushed: [],
      url: null,
    };
  },
  methods: {
    async downloadRatings() {
      const reviewedRatings = _.filter(
        Object.values(this.subjectRatings),
        (o) => {return o.reviewed;}
      );

      const csvRows = reviewedRatings.map(
        (o) => {
          return _.pick(o, [
            "subject", "overallRating", "anatRating", "dwiRating", "whenRated"
          ]);
        }
      );

      if (csvRows.length === 0) {
        return
      }

      const delimiter = ",";
      const header = Object.keys(csvRows[0]).join(delimiter) + "\n";

      let csv = header;
      csvRows.forEach( o => {
          csv += Object.values(o).join(delimiter) + "\n";
      });

      let csvData = new Blob([csv], { type: "text/csv" });
      let csvUrl = URL.createObjectURL(csvData);

      let hiddenElement = document.createElement("a");
      hiddenElement.href = csvUrl;
      hiddenElement.target = "_blank";
      hiddenElement.download = "dwiqc_ratings.csv";
      hiddenElement.click();
    },
    updateSelectedSubject(subject) {
      this.subjectSelected = subject;
    },
    loadFromQuery() {
      if (this.$route.query) {
        // load the json
        if (
          !(this.$route.query.url || this.$route.query.s3Uri) &&
          this.$route.name === "GenReport"
        ) {
          this.$router.push("/");
        } else if (this.$route.query.url) {
          this.sourceType = "url";
          this.url = this.$route.query.url;
          // Todo: update this to work with directories instead of single files
          this.loadFromUrl();
        } else if (this.$route.query.s3Uri) {
          this.sourceType = "s3";
          this.s3Uri = this.$route.query.s3Uri;
          this.bucket = this.s3Uri.split("/")[0];
          this.s3Prefix = this.s3Uri.split("/").splice(1).join("/");
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
    /**
     * Begin S3 parsing functions
     */
    xmlParser(input) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, "text/xml");
      return xmlDoc;
    },
    parseS3(data) {
      const xml = this.xmlParser(data);
      const keys = xml.getElementsByTagName("Key");
      const continuation = xml.getElementsByTagName("NextContinuationToken");
      const isTruncated = xml.getElementsByTagName("IsTruncated")[0].innerHTML;
      if (isTruncated === "true") {
        this.continuation = encodeURIComponent(continuation[0].innerHTML);
      } else {
        this.continuation = null;
      }
      const allKeys = _.map(keys, (k) => k.innerHTML);
      const reportsFiltered = _.filter(allKeys, (k) =>
        k.endsWith("dwiqc.json")
      );
      const keysFixed = _.uniq(reportsFiltered);
      return keysFixed;
    },
    S3Continuation(token) {
      if (!token) {
        return 0;
      }
      const url = this.s3ListUrl + `&continuation-token=${token}`;
      return axios.get(url).then((resp) => {
        const keysFixed2 = this.parseS3(resp.data);
        this.manifestEntries = _.uniq(this.manifestEntries.concat(keysFixed2));
        if (this.continuation) {
          this.S3Continuation(this.continuation);
        }
      });
    },
    loadFromS3() {
      const that = this;
      const url = this.s3ListUrl;
      return axios
        .get(url)
        .then((resp) => {
          const keysFixed = this.parseS3(resp.data);
          this.manifestEntries = _.uniq(this.manifestEntries.concat(keysFixed));
          if (this.continuation) {
            this.S3Continuation(this.continuation);
          }
        })
        .then(() => {
          this.groupFile = this.manifestEntries.filter(
            (k) => k.match(that.re) === null
          );
          this.files = this.manifestEntries.filter(
            (k) => k.match(that.re) !== null
          );
          this.selectRootGroupFile();
          this.loadGroupReport();
        });
    },
    getFileDepth(file) {
      if (this.sourceType === "file") {
        return file.webkitRelativePath.split("/").length;
      } else if (this.sourceType === "s3") {
        return file.split("/").length;
      }
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
            report: null,
            whenRequested: null,
          }),
          o
        ),
        {}
      );
      return reports;
    },
    async initSubjectRatings(participantFileMap) {
      const ratings = await _.reduce(
        Object.keys(participantFileMap),
        (o, k) => (
          (o[k] = {
            subject: k,
            source: participantFileMap[k],
            overallRating: null,
            anatRating: null,
            dwiRating: null,
            whenRated: null,
            reviewed: false,
          }),
          o
        ),
        {}
      );
      return ratings;
    },
    async loadGroupReport() {
      if (this.sourceType === "file") {
        const gr = await this.readJsonFile(this.groupFile);
        this.groupReport = gr["content"];
      } else if (this.sourceType === "s3") {
        const resp = await axios.get(
          this.localhostProxy(
            `https://${this.bucket}.s3.amazonaws.com/${this.groupFile}`
          )
        );
        this.groupReport = resp.data;
      }
    },
    async updateSubjectReports(subject_id) {
      let sr = this.subjectReports[subject_id];
      if (sr["report"] == null) {
        // use the abstract equality operator to test for both null and undefined
        if (this.sourceType === "file") {
          const report = await this.readJsonFile(sr["source"]);
          sr["report"] = report["content"];
          if (report["content"]["subject_id"] === "sub-test") {
            sr["report"]["subject_id"] = subject_id;
          }
        } else if (this.sourceType === "s3") {
          const resp = await axios.get(
            this.localhostProxy(
              `https://${this.bucket}.s3.amazonaws.com/${sr["source"]}`
            )
          );
          sr["report"] = resp.data;
          if (resp.data["subject_id"] === "sub-test") {
            sr["report"]["subject_id"] = subject_id;
          }
        } else if (this.sourceType === "url") {
          console.log("URL sources are currently not supported.");
        }
      }
      sr["whenRequested"] = new Date();
    },
    localhostProxy(url) {
      const local_domains = ["localhost", "127.0.0.1"];
      if (local_domains.includes(window.location.hostname)) {
        const proxyurl = "https://cors-anywhere.herokuapp.com/";
        return proxyurl + url;
      } else {
        return url;
      }
    },
  },
  created() {
    this.loadFromQuery();
  },
  mounted() {
    if (this.filesProp) {
      this.sourceType = "file";
      this.files = this.filesProp;
    }
    if (this.groupFileProp) {
      this.sourceType = "file";
      this.groupFile = this.groupFileProp;
      this.selectRootGroupFile();
      this.loadGroupReport();
    }
  },
  computed: {
    s3ListUrl() {
      let url = `https://${this.bucket}.s3.amazonaws.com/?list-type=2`;
      url += `&max-keys=100000&prefix=${this.s3Prefix}`;
      return this.localhostProxy(url);
    },
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
        if (this.sourceType === "file") {
          return _.reduce(
            this.files,
            (o, k) => ((o[[...new Set(k.name.match(this.re))][0]] = k), o),
            {}
          );
        } else if (this.sourceType === "s3") {
          return _.reduce(
            this.files,
            (o, k) => ((o[[...new Set(k.match(this.re))][0]] = k), o),
            {}
          );
        } else {
          return {};
        }
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
        this.subjectRatings = await this.initSubjectRatings(
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
