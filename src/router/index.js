import Vue from "vue";
import Router from "vue-router";
import LandingPage from "@/components/LandingPage";
import genReport from "@/components/GenReport";

Vue.use(Router);

export default new Router({
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
