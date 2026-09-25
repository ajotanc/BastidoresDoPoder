import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable para rastrear a seção ativa da página através de ScrollSpy com IntersectionObserver.
 * Baseado no padrão de observação suave de seções ativas.
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const activeSectionId = ref<string>(sectionIds[0] ?? '');
  const visibleSections = ref<Record<string, boolean>>({});
  let observer: IntersectionObserver | null = null;

  /**
   * Monitora a posição de rolagem para alternar para a primeira seção se estiver no topo
   * ou para a última seção se atingir o final da página.
   */
  const handleScroll = (): void => {
    if (typeof window === 'undefined') return;

    // Se estiver no topo da página (hero/banner)
    if (window.scrollY < 200) {
      if (sectionIds[0]) {
        activeSectionId.value = sectionIds[0];
      }
      return;
    }

    // Se atingir o final da página
    const isAtBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

    if (isAtBottom && sectionIds.length > 0) {
      const lastSectionId = sectionIds[sectionIds.length - 1];
      if (lastSectionId) {
        activeSectionId.value = lastSectionId;
      }
    }
  };

  /**
   * Configura o IntersectionObserver para observar os elementos das seções.
   */
  const setupScrollSpy = (): void => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    if (observer) {
      observer.disconnect();
    }

    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleSections.value[entry.target.id] = entry.isIntersecting;
        }

        if (window.scrollY < 200) {
          if (sectionIds[0]) {
            activeSectionId.value = sectionIds[0];
          }
          return;
        }

        const intersecting = sectionIds.filter((id) => visibleSections.value[id]);
        if (intersecting.length > 0) {
          let bestSection = intersecting[0] ?? sectionIds[0] ?? '';
          let minDistance = Number.POSITIVE_INFINITY;
          const headerElement = document.querySelector('header');
          const headerHeight = headerElement ? headerElement.offsetHeight : 60;

          for (const id of intersecting) {
            const element = document.getElementById(id);
            if (element) {
              const rect = element.getBoundingClientRect();
              const distance = Math.abs(rect.top - headerHeight);
              if (distance < minDistance) {
                minDistance = distance;
                bestSection = id;
              }
            }
          }

          if (bestSection) {
            activeSectionId.value = bestSection;
          }
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: 0,
      }
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }
  };

  onMounted(() => {
    setupScrollSpy();
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll);
    }
  });

  return {
    activeSectionId,
    setupScrollSpy,
  };
}
