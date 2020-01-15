import Vue from 'vue';
import Router from 'vue-router';
import GenReport from '@/components/GenReport';
import ReportStandalone from '@/components/ReportStandalone';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'GenReport',
      component: GenReport,
    },
    {
      path: '/report',
      name: 'ReportStandalone',
      component: ReportStandalone,
    },
  ],
});
