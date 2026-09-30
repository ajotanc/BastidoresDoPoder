import { afterEach, expect, it, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
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
