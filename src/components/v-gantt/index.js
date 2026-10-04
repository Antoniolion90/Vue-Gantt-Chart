import gantt from "./gantt.vue";

// __VERSION__ is replaced with the package version by Vite (see `define` in the configs)
gantt.version = __VERSION__;
gantt.install = function (app) {
  app.component("v-gantt-chart", gantt);
};

export default gantt;
