<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OnlineGameView from '@/components/online/OnlineGameView.vue';

interface Props {
  id?: string;
}

const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();

const currentRoomId = computed<string | undefined>(() => {
  if (props.id) return props.id;
  const paramId = route.params.id;
  if (typeof paramId === 'string' && paramId.trim()) {
    return paramId.trim();
  }
  return undefined;
});

const handleBackToManual = (): void => {
  router.push('/');
};

const handleRoomEntered = (roomCode: string): void => {
  if (route.params.id !== roomCode) {
    router.replace({ name: 'game', params: { id: roomCode } });
  }
};

const handleRoomLeft = (): void => {
  if (route.name !== 'online') {
    router.replace('/online');
  }
};
</script>

<template>
  <div class="w-full">
    <OnlineGameView
      :initial-room-id="currentRoomId"
      @back-to-manual="handleBackToManual"
      @room-entered="handleRoomEntered"
      @room-left="handleRoomLeft"
    />
  </div>
</template>
