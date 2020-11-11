import Vue from "vue";
import VueRouter from "vue-router";
import LandingPage from "@/components/LandingPage";
import genReport from "@/components/GenReport";

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    {
      path: "/",
      name: "LandingPage",
      component: LandingPage,
    },
    {
      path: "/report",
      name: "GenReport",
      component: genReport,
    },
  ],
});
