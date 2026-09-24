import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable para rastrear a seção ativa da página através de IntersectionObserver.
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const activeSectionId = ref<string>(sectionIds[0] ?? '');
  let observerInstance: IntersectionObserver | null = null;

  onMounted(() => {
    try {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return;
      }

      observerInstance = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          const visibleEntries = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visibleEntries.length > 0 && visibleEntries[0]?.target.id) {
            activeSectionId.value = visibleEntries[0].target.id;
          }
        },
        {
          rootMargin: '-10% 0px -60% 0px',
          threshold: 0,
        }
      );

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          observerInstance.observe(element);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn('Erro ao inicializar o observador de seções:', error.message);
      }
    }
  });

  onUnmounted(() => {
    if (observerInstance) {
      observerInstance.disconnect();
      observerInstance = null;
    }
  });

  return {
    activeSectionId,
  };
}
