import gantt from "./gantt.vue";

gantt.version = "__VERSION__";
gantt.install = function(app) {
  app.component("v-gantt-chart", gantt);
};

export default gantt;
