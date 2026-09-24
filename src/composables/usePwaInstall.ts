import { ref, onMounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

/**
 * Composable para gerenciar a instalação do PWA na mesa de jogo.
 */
export function usePwaInstall() {
  const isInstallable = ref<boolean>(false);
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const isInstalled = ref<boolean>(false);

  onMounted(() => {
    try {
      if (typeof window === 'undefined') return;

      // Detecta se já está rodando em modo standalone (PWA instalado)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled.value = true;
      }

      window.addEventListener('beforeinstallprompt', (event: Event) => {
        event.preventDefault();
        deferredPrompt.value = event as BeforeInstallPromptEvent;
        isInstallable.value = true;
      });

      window.addEventListener('appinstalled', () => {
        isInstalled.value = true;
        isInstallable.value = false;
        deferredPrompt.value = null;
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn('Erro ao configurar listener de PWA:', error.message);
      }
    }
  });

  /**
   * Dispara o prompt nativo de instalação do PWA.
   */
  const installApp = async (): Promise<void> => {
    if (!deferredPrompt.value) return;

    try {
      await deferredPrompt.value.prompt();
      const choice = await deferredPrompt.value.userChoice;
      if (choice.outcome === 'accepted') {
        isInstallable.value = false;
      }
      deferredPrompt.value = null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Falha ao instalar o aplicativo:', error.message);
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}
