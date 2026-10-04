<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { ArrowUpRight } from '@lucide/vue';
import { Spinner } from '@/components/ui/spinner';
import Discord from '@/components/ui/icons/Discord.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { DiscordConversation } from '@/online/room/discordConversation';
const props = defineProps<{ conversation?: DiscordConversation; compact?: boolean; canRetry?: boolean }>();
const safeUrl = computed(() => /^https:\/\/discord\.gg\/[\w-]+$/.test(props.conversation?.url ?? '') ? props.conversation?.url : undefined);
const emit = defineEmits<{ (e: 'retry'): void }>();
const now = ref(Date.now());
let timer: ReturnType<typeof setTimeout> | undefined;
const updateClock = () => {
  if (timer) clearTimeout(timer);
  now.value = Date.now();
  const next = [props.conversation?.expiresAt, props.conversation?.retryAt].filter((time): time is number => typeof time === 'number' && time > now.value).sort((a,b) => a-b)[0];
  if (next) timer = setTimeout(updateClock, Math.min(next - now.value + 1, 2147483647));
};
watch(() => props.conversation, updateClock, { immediate: true, deep: true });
onBeforeUnmount(() => { if (timer) clearTimeout(timer); });
const expired = computed(() => props.conversation?.status === 'ready' && (props.conversation.expiresAt ?? 0) <= now.value);
const ready = computed(() => props.conversation?.status === 'ready' && !!safeUrl.value && !expired.value);
const retryAllowed = computed(() => !!props.canRetry && !ready.value && props.conversation?.status !== 'loading' && (props.conversation?.retryAt ?? 0) <= now.value);
const actionLabel = computed(() => props.conversation?.status === 'loading' ? 'Criando conversa' : retryAllowed.value ? props.conversation?.status === 'auth-required' ? 'Conectar Discord' : 'Tentar novamente' : expired.value ? 'Conversa expirada' : 'Conversa indisponível');
const iconLabel = computed(() => ready.value ? 'Entrar na conversa no Discord' : `${actionLabel.value} — Discord`);
const description = computed(() => props.conversation?.status === 'loading' ? 'Preparando o canal de voz…' : ready.value ? 'Combine alianças, negocie e ponha seu blefe à prova.' : props.conversation?.status === 'auth-required' ? props.canRetry ? 'Conecte sua conta para abrir a conversa da mesa.' : 'Aguardando o anfitrião conectar o Discord.' : expired.value ? 'O convite expirou. O anfitrião pode abrir uma nova conversa.' : 'Discord indisponível. Você pode continuar jogando.');
</script>
<template>
  <template v-if="conversation && compact">
    <a v-if="ready" :href="safeUrl" target="_blank" rel="noopener noreferrer" class="online-icon-button shrink-0 text-gold-light" :aria-label="iconLabel" :title="iconLabel">
      <Discord class="size-5" />
    </a>
    <AppButton variant="outline" size="icon" class="shrink-0" v-else :disabled="!retryAllowed" @click="emit('retry')" :aria-label="iconLabel" :title="iconLabel">
      <Discord class="size-5" :class="{ 'motion-safe:animate-pulse': conversation.status === 'loading' }" />
    </AppButton>
  </template>
  <aside v-else-if="conversation" class="conversation-panel relative overflow-hidden rounded border border-line bg-surface shadow-card" aria-label="Conversa da mesa">
    <div class="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-5">
      <div class="flex min-w-0 items-center gap-3.5">
        <div class="flex size-12 shrink-0 items-center justify-center rounded border border-gold/25 bg-paper-deep/60 text-gold-light">
          <Discord class="size-7" />
        </div>
        <div class="min-w-0">
          <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-muted">Voz no Discord</p>
          <h3 class="game-section-title">Conversa da mesa</h3>
          <p class="mt-1.5 max-w-md text-xs leading-relaxed text-ink-muted" role="status">{{ description }}</p>
        </div>
      </div>
      <div class="relative gold-divider-top pt-4 sm:shrink-0 sm:pt-0 sm:before:hidden">
        <AppButton v-if="ready" :href="safeUrl" target="_blank" variant="primary" class="w-full justify-between sm:min-w-48">
          Entrar na conversa <ArrowUpRight class="size-4 shrink-0" aria-hidden="true" />
        </AppButton>
        <AppButton v-else variant="primary" :disabled="!retryAllowed" @click="emit('retry')" class="w-full sm:min-w-48" :aria-busy="conversation.status === 'loading'">
          <Spinner v-if="conversation.status === 'loading'" size="sm" aria-hidden="true" />
          {{ actionLabel }}
        </AppButton>
      </div>
    </div>
  </aside>
</template>
<style scoped>
.conversation-panel {
  background-image: radial-gradient(ellipse at 0% 0%, rgb(230 191 115 / 7%), transparent 65%);
}
</style>
