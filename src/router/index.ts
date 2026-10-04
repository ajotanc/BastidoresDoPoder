import { GAME_NAME } from '@/constants/gameConfig';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
const ManualView = () => import('@/views/ManualView.vue');
const OnlineView = () => import('@/views/OnlineView.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: ManualView,
    meta: {
      title: `${GAME_NAME  } — Manual de regras`,
    },
  },
  {
    path: '/rules',
    name: 'rules',
    component: ManualView,
    meta: {
      title: `${GAME_NAME  } — Manual de regras`,
    },
  },
  {
    path: '/game',
    name: 'game',
    component: OnlineView,
    meta: {
      title: `${GAME_NAME  } — Gabinete Online`,
    },
  },
  {
    path: '/room/:id',
    name: 'room',
    component: OnlineView,
    props: true,
    meta: {
      title: `${GAME_NAME  } — Mesa de Jogo`,
    },
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
    if (to.name === 'room' && to.params.id) {
      const roomId = String(to.params.id).toUpperCase();
      document.title = `${GAME_NAME} — Mesa ${roomId}`;
    } else if (typeof to.meta.title === 'string') {
      document.title = to.meta.title;
    }
  }
});

export default router;
