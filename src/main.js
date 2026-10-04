import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import bus from "@/utils/bus";

import vGanttChart from "@/components/v-gantt/index";
import contextMenu from "@/components/context-menu/index";
import "@/components/context-menu/style.css";
import "@/style/index.sass";

// Element Plus component styles are imported on demand by unplugin-vue-components;
// ElMessage is used from code, so its style is imported here
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";

const app = createApp(App);

app.config.globalProperties.$bus = bus;
app.config.globalProperties.$message = ElMessage;
app.use(store);
app.use(contextMenu);
app.use(vGanttChart);
app.mount("#app");
