import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { pinia } from '@/stores';
import { useDeveloperMode } from '@/composables/useDeveloperMode';
import VueConfetti from 'vue-confetti';

import '@/styles/main.css';
import '@/styles/fonts.css';

/**
 * Ponto de entrada da aplicação Bastidores do Poder.
 */
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(useDeveloperMode);
app.use(VueConfetti);

app.mount('#app');
