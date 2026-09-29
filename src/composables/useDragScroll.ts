import { ref } from 'vue';

/** Mouse/pen dragging; touch keeps native scrolling and momentum. */
export function useDragScroll() {
  const isDragging = ref(false);
  let pointerId: number | null = null;
  let startX = 0;
  let initialScroll = 0;
  let suppressClick = false;

  const onPointerDown = (event: PointerEvent) => {
    suppressClick = false;
    if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
    const element = event.currentTarget as HTMLElement;
    // A short mouse movement must not swallow card clicks when nothing can scroll.
    if (element.scrollWidth <= element.clientWidth) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    initialScroll = element.scrollLeft;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const element = event.currentTarget as HTMLElement;
    const distance = event.clientX - startX;
    if (!isDragging.value && Math.abs(distance) < 6) return;
    if (!isDragging.value) {
      isDragging.value = true;
      suppressClick = true;
      element.classList.add('is-dragging');
      element.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    element.scrollLeft = initialScroll - distance;
  };
  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const element = event.currentTarget as HTMLElement;
    pointerId = null;
    isDragging.value = false;
    element.classList.remove('is-dragging');
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (!isDragging.value) onPointerEnd(event);
  };
  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  };

  return { isDragging, onPointerDown, onPointerMove, onPointerEnd, onPointerLeave, onClickCapture };
}
