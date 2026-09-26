import { ref, watch, onUnmounted, computed, type Ref } from 'vue';

export const useGameTimer = (deadlineAt: Ref<number | null | undefined>, totalDurationMs = 15000) => {
  const millisRemaining = ref<number>(0);
  let animationFrameId: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const update = (): void => {
    if (!deadlineAt.value) {
      millisRemaining.value = 0;
      return;
    }
    const diff = deadlineAt.value - Date.now();
    millisRemaining.value = Math.max(0, diff);
  };

  const start = (): void => {
    stop();
    update();
    intervalId = setInterval(update, 100);
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  watch(
    () => deadlineAt.value,
    (val) => {
      if (val) {
        start();
      } else {
        stop();
        millisRemaining.value = 0;
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    stop();
  });

  const secondsRemaining = computed(() => {
    return Math.ceil(millisRemaining.value / 1000);
  });

  const progressPercentage = computed(() => {
    if (!deadlineAt.value || totalDurationMs <= 0) return 0;
    const pct = (millisRemaining.value / totalDurationMs) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  const isUrgent = computed(() => {
    return secondsRemaining.value <= 5 && secondsRemaining.value > 0;
  });

  return {
    millisRemaining,
    secondsRemaining,
    progressPercentage,
    isUrgent,
  };
};
