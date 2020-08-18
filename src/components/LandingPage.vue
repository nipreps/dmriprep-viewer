<template>
  <b-container>
    <b-container v-if="state === 'getInput'">
      <img class="logo" src="../assets/dmriprep-icon.svg" />
      <h1>dmriprep Viewer</h1>
      <p class="lead">
        Upload your report.json file generated with dmriprep or qsiprep
      </p>
      <b-form-file
        class="mt-3"
        v-model="file"
        accept="*.json"
        :state="Boolean(file)"
        placeholder="Choose a file..."
      ></b-form-file>

      <p class="lead mt-3">OR copy/paste a URL</p>
      <b-input-group size="md" class="mb-3" prepend="URL">
        <b-form-input
          v-model="url"
          placeholder="Enter a URL..."
          @keyup.enter="navigate"
        />
        <b-input-group-append>
          <b-btn size="md" text="Button" variant="primary" @click="navigate"
            >Go</b-btn
          >
        </b-input-group-append>
      </b-input-group>

      <p class="lead mt-3">OR point to a report file on Amazon S3</p>
      <b-input-group size="md" class="mb-3" prepend="S3 URI">
        <b-form-input
          v-model="s3Uri"
          placeholder="Enter an Amazon S3 URI..."
          @keyup.enter="s3"
        />
        <b-input-group-append>
          <b-btn size="md" text="Button" variant="primary" @click="s3"
            >Go</b-btn
          >
        </b-input-group-append>
      </b-input-group>
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
      s3Uri: null,
      state: "getInput",
    };
  },
  methods: {
    navigate() {
      this.$router.push({ path: "/report", query: { url: this.url } });
    },
    s3() {
      if (this.s3Uri.startsWith("s3://")) {
        this.s3Uri = this.s3Uri.replace("s3://", "");
      }
      this.$router.push({ path: "/report", query: { s3Uri: this.s3Uri } });
    },
  },
  watch: {
    file() {
      if (this.file) {
        const reader = new FileReader();
        const self = this;
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
