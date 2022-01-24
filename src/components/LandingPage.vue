<template>
  <b-container>
    <b-container fluid class="px-0" v-if="state === 'getInput'">
      <b-row class="d-flex align-items-center">
        <b-col cols="5" class="text-right">
          <img class="logo" src="../assets/dmriprep-icon.svg" />
        </b-col>
        <b-col cols="7" class="text-left">
          <h1>dmriprep Viewer</h1>
        </b-col>
      </b-row>

      <b-form-group
        label="Choose a directory containing vaqc.json files generated with dmriprep or qsiprep:"
        description="All computation happens on the client side. Your report will not be uploaded to any server."
        class="mt-5 text-left"
      >
        <b-form-file
          v-model="files"
          directory
          multiple
          placeholder="Choose a directory..."
        ></b-form-file>
      </b-form-group>

      <b-form-group
        label="OR copy/paste an Amazon S3 URI:"
        description="Enter a valid Amazon S3 URI of the form s3://bucket/followed/by/a/key."
        class="mt-5 text-left"
      >
        <b-input-group size="md" class="mb-3" prepend="URL">
          <b-form-input
            v-model="url"
            placeholder="s3://dmriprep-viewer-example-data"
            @keyup.enter="navigate"
          />
          <b-input-group-append>
            <b-btn size="md" text="Button" variant="primary" @click="navigate"
              >Go</b-btn
            >
          </b-input-group-append>
        </b-input-group>
      </b-form-group>
    </b-container>

    <spinner v-if="state === 'showLoader'"></spinner>
    <genReport
      v-if="state === 'showReports'"
      :filesProp="reportFiles"
      :groupFileProp="groupReportFiles"
    ></genReport>
  </b-container>
</template>

<script>
import genReport from "./GenReport";
import router from "../router";
import spinner from "./Spinner";

export default {
  name: "LandingPage",
  components: {
    genReport,
    spinner,
  },
  data() {
    return {
      files: null,
      reportFiles: null,
      groupReportFiles: null,
      msg: "Welcome to dmriprep-viewer",
      report: {},
      url: null,
      state: "getInput",
    };
  },
  methods: {
    navigate() {
      if (this.url.startsWith("s3://")) {
        this.s3();
      } else {
        this.followUrl();
      }
    },
    followUrl() {
      router.push({ path: "/report", query: { url: this.url } });
    },
    s3() {
      router.push({
        path: "/report",
        query: { s3Uri: this.url.replace("s3://", "") },
      });
    },
  },
  watch: {
    files() {
      if (this.files) {
        this.state = "showLoader";

        // We may have many files. Find all of the *_vaqc.json files
        this.reportFiles = this.files.filter((file) =>
          file.name.endsWith("_vaqc.json")
        );

        // And find the group report file if available
        this.groupReportFiles = this.files.filter(
          (file) => file.name === "vaqc.json"
        );

        this.state = "showReports";

        // let reportContents = await Promise.all(
        //   await this.getAllReportsFromFiles(allReportFiles)
        // );

        // console.log(reportContents);
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.logo {
  max-width: 250px;
  width: 100%;
  height: auto;
}

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
