import { ref, onMounted, onUnmounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const isInstallable = ref(false);
  const isInstalled = ref(false);
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const onPrompt = (event: Event): void => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    isInstallable.value = !isInstalled.value;
  };
  const onInstalled = (): void => {
    isInstalled.value = true;
    isInstallable.value = false;
    deferredPrompt = null;
  };
  onMounted(() => {
    isInstalled.value = window.matchMedia('(display-mode: standalone)').matches;
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
  });
  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
    deferredPrompt = null;
  });

  const installApp = async (): Promise<void> => {
    const promptEvent = deferredPrompt;
    if (!promptEvent) return;
    // Each browser prompt may only be used once, including a dismissed prompt.
    deferredPrompt = null;
    isInstallable.value = false;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error: unknown) {
      console.error('Falha ao instalar o aplicativo:', error);
    }
  };
  return { isInstallable, isInstalled, installApp };
}
