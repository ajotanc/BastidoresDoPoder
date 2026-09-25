/** Navigate to a section while preserving deep links and keyboard focus. */
export function scrollToSection(sectionId: string, event?: Event): void {
  if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
  const id = sectionId.replace(/^#/, '');
  const target = document.getElementById(id);
  if (!target) return;
  event?.preventDefault();
  const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;
  const top = id === 'manual' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 12);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
}
