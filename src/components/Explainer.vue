<template>
  <b-container v-if="collapseId && questionId" class="text-right">
    <b-icon
      v-b-toggle="collapseId"
      :id="closeId"
      class="question-mark when-open"
      icon="x-circle"
      variant="primary"
      aria-hidden="true"
    ></b-icon>
    <b-icon
      v-b-toggle="collapseId"
      :id="questionId"
      class="question-mark when-closed"
      icon="question-circle"
      variant="primary"
      aria-hidden="true"
    ></b-icon>
    <b-collapse :id="collapseId" class="mb-2 text-left">
      <b-card>
        <p class="card-text">{{ explainerText }}</p>
      </b-card>
    </b-collapse>
    <b-tooltip :target="questionId" triggers="hover"
      >learn more about this component</b-tooltip
    >
    <b-tooltip :target="closeId" triggers="hover"
      >close the explainer</b-tooltip
    >
  </b-container>
</template>

<script>
export default {
  name: "explainer",
  data() {
    return {
      collapseId: null,
      questionId: null,
      closeId: null,
    };
  },
  props: {
    explainerText: {
      type: String,
      default: "Here is a helpful description of this component!",
    },
  },
  mounted() {
    this.collapseId = "collapse" + this._uid;
    this.questionId = "question" + this._uid;
    this.closeId = "close" + this._uid;
  },
};
</script>

<style scoped>
.question-mark {
  cursor: pointer;
}

.collapsed.when-open,
.not-collapsed.when-closed {
  display: none;
}
</style>
