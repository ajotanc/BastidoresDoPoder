/**
 * Utilitário de rolagem suave com interpolação ease-out cubic.
 * Evita poluição de hash na URL e garante scroll suave preciso entre seções.
 */

/**
 * Realiza uma rolagem suave customizada com interpolação ease-out cubic
 */
export function customSmoothScroll(targetY: number, duration = 380): void {
  if (typeof window === 'undefined') return;

  const startPosition = window.scrollY;
  const distance = targetY - startPosition;

  if (Math.abs(distance) < 2) {
    window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
    return;
  }

  let startTime: number | null = null;

  // Curva ágil e suave de desaceleração (ease-out cubic)
  const easeOutCubic = (timeProgress: number): number => 1 - Math.pow(1 - timeProgress, 3);

  const step = (currentTime: number): void => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    window.scrollTo({
      top: startPosition + distance * easeOutCubic(progress),
      behavior: 'instant' as ScrollBehavior,
    });

    if (elapsed < duration) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

/**
 * Remove qualquer hash presente na URL sem disparar recarregamento ou cancelamento de scroll.
 */
export function clearUrlHash(): void {
  if (typeof window !== 'undefined' && window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/**
 * Rola diretamente até a posição exata do elemento identificado pelo ID,
 * compensando a altura da barra fixa de navegação.
 */
export function scrollToSection(sectionId: string, event?: Event | MouseEvent): void {
  if (event) {
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) {
      return;
    }
    event.preventDefault();
    if ('currentTarget' in event && event.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }
  }

  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const cleanId = sectionId.replace(/^#/, '');

  if (cleanId === 'manual' || cleanId === 'home') {
    customSmoothScroll(0, 350);
    clearUrlHash();
    return;
  }

  const targetElement = document.getElementById(cleanId);
  if (targetElement) {
    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.offsetHeight : 64;
    const rect = targetElement.getBoundingClientRect();
    const targetY = Math.max(0, rect.top + window.scrollY - headerHeight - 12);

    customSmoothScroll(targetY, 350);
  }

  clearUrlHash();
}

