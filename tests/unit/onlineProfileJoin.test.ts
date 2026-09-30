import { afterEach, expect, it, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import AppDialog from '@/components/ui/AppDialog.vue';
import LobbyRoom from '@/components/online/LobbyRoom.vue';
import OnlineGameView from '@/components/online/OnlineGameView.vue';
import { useGameStore } from '@/stores/gameStore';
import { PROFILE_STORAGE_KEY } from '@/utils/playerProfile';

afterEach(() => {
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  vi.restoreAllMocks();
});

it('envia a foto salva do perfil ao entrar em uma sala existente', async () => {
  const avatarImage = 'data:image/webp;base64,AAAA';
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ name: 'Ana', avatarSlug: 'lawyer', avatarImage }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const join = vi.spyOn(useGameStore(), 'joinRoom').mockResolvedValue();
  const wrapper = shallowMount(OnlineGameView, { props: { initialRoomId: 'TEST' }, global: { plugins: [pinia] } });
  try {
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(join).toHaveBeenCalledWith('TEST', 'Ana', undefined, avatarImage);
  } finally {
    wrapper.unmount();
  }
});

it('pede confirmação antes de o anfitrião abandonar a mesa e permite cancelar', async () => {
  const pinia = createPinia(); setActivePinia(pinia);
  const store = useGameStore();
  store.gameState = createInitialAuthoritativeState('ROOM', 'host', 'Ana', undefined, 'token').publicState;
  store.mode = 'lobby'; store.isHost = true; store.myPlayerId = 'host';
  const leave = vi.spyOn(store, 'leaveRoom');
  const wrapper = shallowMount(OnlineGameView, { global: { plugins: [pinia] } });
  try {
    wrapper.findComponent(LobbyRoom).vm.$emit('leave');
    await flushPromises();
    expect(wrapper.findAllComponents(AppDialog).find(dialog => dialog.props('ariaLabel') === 'Sair da mesa')!.props('isOpen')).toBe(true);
    expect(leave).not.toHaveBeenCalled();
    wrapper.findAllComponents(AppDialog).find(dialog => dialog.props('ariaLabel') === 'Sair da mesa')!.vm.$emit('close');
    await flushPromises();
    expect(wrapper.findAllComponents(AppDialog).find(dialog => dialog.props('ariaLabel') === 'Sair da mesa')!.props('isOpen')).toBe(false);
    expect(leave).not.toHaveBeenCalled();
  } finally { wrapper.unmount(); }
});
