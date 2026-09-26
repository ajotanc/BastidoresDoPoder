import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import ManualView from '@/views/ManualView.vue';
import OnlineView from '@/views/OnlineView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: ManualView,
    meta: {
      title: 'Bastidores do Poder — Manual de Regras',
    },
  },
  {
    path: '/rules',
    name: 'rules',
    component: ManualView,
    meta: {
      title: 'Bastidores do Poder — Manual de Regras',
    },
  },
  {
    path: '/online',
    name: 'online',
    component: OnlineView,
    meta: {
      title: 'Bastidores do Poder — Gabinete Online',
    },
  },
  {
    path: '/game/:id',
    name: 'game',
    component: OnlineView,
    props: true,
    meta: {
      title: 'Bastidores do Poder — Mesa de Jogo',
    },
  },
  // Redirecionamento amigável em inglês (/play/:id -> /game/:id)
  {
    path: '/play/:id',
    redirect: (to) => ({ name: 'game', params: { id: to.params.id } }),
  },
  // Retrocompatibilidade com links antigos /jogar/:id
  {
    path: '/jogar/:id',
    redirect: (to) => ({ name: 'game', params: { id: to.params.id } }),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return false;
    }
    return { top: 0, behavior: 'smooth' };
  },
});

router.afterEach((to) => {
  if (typeof document !== 'undefined') {
    if (to.name === 'game' && to.params.id) {
      const roomId = String(to.params.id).toUpperCase();
      document.title = `Bastidores do Poder — Mesa ${roomId}`;
    } else if (typeof to.meta.title === 'string') {
      document.title = to.meta.title;
    }
  }
});

export default router;
