// import { createApp } from 'vue';
// import App from './App.vue';
// import router from './router';
// import vuetify from './plugins/vuetify';
// import { loadFonts } from './plugins/webfontloader';
//
// loadFonts();
//
// createApp(App)
//   .use(router)
//   .use(vuetify)
//   .mount('#app');
//

import { createPinia } from 'pinia';
// import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/scss/bootstrap.scss';
// import CountryFlag from 'vue-country-flag-next';// https://www.npmjs.com/package/vue-country-flag-next
// import { library } from '@fortawesome/fontawesome-svg-core';
// import { faCheck, faGlobe, faTimes } from '@fortawesome/free-solid-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // https://github.com/FortAwesome/vue-fontawesome
import Toast, {PluginOptions, POSITION} from 'vue-toastification'; // https://openbase.com/js/vue-toastification
import 'vue-toastification/dist/index.css';
// import vuetify from './plugins/vuetify';
import i18n from '@/plugins/i18n';
// https://github.com/eladcandroid/v-idle-3
import Vidle from 'v-idle-3';
import { LoggerService } from '@/services/logger/logger.service';
import { LogLevel } from '@/services/logger/log-level';
import { ServiceTypeEnum } from '@/services/logger/service-type.enum';
// https://www.primefaces.org/primevue/setup
import PrimeVue from 'primevue/config';

// https://www.npmjs.com/package/vue-sidebar-menu
// import VueSidebarMenu from 'vue-sidebar-menu'
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Image from 'primevue/image';
import piniaPersist from 'pinia-plugin-persist'
//https://www.npmjs.com/package/vue-debounce
import { vue3Debounce } from 'vue-debounce';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import IconComponent from "@/components/features/IconComponent.vue";

// Lucide Icons
// https://github.com/lucide-icons/lucide/tree/master/packages/lucide-vue-next#lucide-vue-next

// library.add(faGlobe, faCheck, faTimes);

const toastOptions: PluginOptions = {
  // You can set your default options here
  position: POSITION.BOTTOM_RIGHT

};

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersist);
const logger = new LoggerService();

app.use(router)
  .use(pinia)
  .use(i18n)
  .use(Toast, toastOptions)
  // .use(vuetify)
  .use(PrimeVue)
  .use(Vidle)
  .provide('logger', logger)
  .component('Button', Button)
  .component('InputText', InputText)
  .component('DataTable', DataTable)
  .component('Column', Column)
  .component('Image' , Image)
  .component('Icon', IconComponent)
  .directive('debounce', vue3Debounce({lock: true}))
  // .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app');

// app.config.errorHandler = (err, instance, info) => {
//   logger.logToConsole(LogLevel.ERROR, ServiceTypeEnum.GLOBAL_ERROR_HANDLER, 'ErrorHandler', JSON.stringify(err), info);
// };
