<template>
  <b-container>
    <b-container v-if="state === 'getInput'">
      <b-row class="d-flex align-items-center">
        <b-col cols="4" class="text-right">
          <img class="logo" src="../assets/dmriprep-icon.svg" />
        </b-col>
        <b-col cols="8" class="text-left">
          <h1>dmriprep Viewer</h1>
        </b-col>
      </b-row>

      <b-form-group
        label="Choose your report.json file generated with dmriprep or qsiprep:"
        description="All computation happens on the client side. Your report will not be uploaded to any server."
        class="mt-5 text-left"
      >
        <b-form-file
          v-model="file"
          accept="*.json"
          :state="Boolean(file)"
          placeholder="Choose a file..."
        ></b-form-file>
      </b-form-group>

      <b-form-group
        label="OR copy/paste a URL or Amazon S3 URI:"
        description="Enter a valid URL or an Amazon S3 URI of the form s3://bucket/followed/by/a/key"
        class="mt-5 text-left"
      >
        <b-input-group size="md" class="mb-3" prepend="URL">
          <b-form-input
            v-model="url"
            placeholder="Enter a URL or Amazon S3 URI..."
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

    <b-container v-if="state === 'showLoader'" class="text-center">
      <strong>Loading...</strong>
      <b-spinner variant="primary" label="loading report"></b-spinner>
    </b-container>
    <genReport v-if="state === 'showReport'" :reportProp="report"></genReport>
  </b-container>
</template>

<script>
import genReport from "./GenReport";

export default {
  name: "LandingPage",
  components: {
    genReport,
  },
  data() {
    return {
      file: null,
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
      this.$router.push({ path: "/report", query: { url: this.url } });
    },
    s3() {
      if (this.url.startsWith("s3://")) {
        this.url = this.url.replace("s3://", "");
      }
      this.$router.push({ path: "/report", query: { s3Uri: this.url } });
    },
  },
  watch: {
    file() {
      if (this.file) {
        const reader = new FileReader();
        const self = this;
        this.state = "showLoader";
        reader.onload = function Load(e) {
          const contents = e.target.result;
          self.report = JSON.parse(contents);
          self.state = "showReport";
        };
        reader.readAsText(this.file);
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
