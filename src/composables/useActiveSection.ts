import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

/**
 * Composable para rastrear a seção ativa da página através de ScrollSpy.
 * Utiliza verificação de linha de leitura com aceleração via requestAnimationFrame
 * e suporte a trava durante rolagem suave acionada por clique.
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const activeSectionId = ref<string>(sectionIds[0] ?? '');
  let isManualNavigating = false;
  let manualNavTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  /**
   * Força a ativação de uma seção imediatamente (ex: ao clicar na navbar)
   * e bloqueia atualizações durante a animação suave de rolagem.
   */
  const setActiveSection = (id: string): void => {
    if (!id) return;
    activeSectionId.value = id;
    isManualNavigating = true;

    if (manualNavTimer) {
      clearTimeout(manualNavTimer);
    }
    manualNavTimer = setTimeout(() => {
      isManualNavigating = false;
    }, 700);
  };

  /**
   * Determina qual seção está atualmente ativa com base na posição da janela.
   */
  const updateActiveSection = (): void => {
    if (typeof window === 'undefined' || isManualNavigating) return;

    const scrollY = window.scrollY;

    // Se estiver no topo da página (área hero)
    if (scrollY < 120) {
      if (sectionIds[0]) {
        activeSectionId.value = sectionIds[0];
      }
      return;
    }

    // Se atingir o final da página
    const isAtBottom =
      window.innerHeight + scrollY >= document.documentElement.scrollHeight - 50;

    if (isAtBottom && sectionIds.length > 0) {
      const lastSectionId = sectionIds[sectionIds.length - 1];
      if (lastSectionId) {
        activeSectionId.value = lastSectionId;
      }
      return;
    }

    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.offsetHeight : 60;
    const triggerLine = headerHeight + 80;

    // Percorre as seções de trás para frente para encontrar a última cujo topo passou da linha de ativação
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const id = sectionIds[i];
      if (!id) continue;
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          activeSectionId.value = id;
          return;
        }
      }
    }

    // Fallback para a primeira seção
    if (sectionIds[0]) {
      activeSectionId.value = sectionIds[0];
    }
  };

  const handleScroll = (): void => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      updateActiveSection();
      rafId = null;
    });
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        // Executa verificação inicial após renderização do DOM
        setTimeout(updateActiveSection, 100);
      }
    });

    onUnmounted(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }
      }
      if (manualNavTimer) {
        clearTimeout(manualNavTimer);
      }
    });
  }

  return {
    activeSectionId,
    setActiveSection,
    updateActiveSection,
  };
}

