import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import bus from "@/utils/bus";

import vGanttChart from "@/components/v-gantt/index";
import contextMenu from "@/components/context-menu/index";
import "@/components/context-menu/style.css";
import "@/style/index.sass";

import "element-plus/dist/index.css";
import { ElLoading, ElMessage } from "element-plus";

const app = createApp(App);

app.config.globalProperties.$bus = bus;
app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$message = ElMessage;
app.provide("$bus", bus);
app.use(ElLoading);
app.use(store);
app.use(contextMenu);
app.use(vGanttChart);
app.mount("#app");
