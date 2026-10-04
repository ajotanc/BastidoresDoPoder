<script setup lang="ts">
import PlayerName from '@/components/online/PlayerName.vue';
import { computed } from 'vue';
import { Trophy, Clock, Users, Globe } from '@lucide/vue';
import { buildResultSummary, durationLabel, type ResultSummary } from '@/game/resultSummary';
import { playerAvatar } from '@/utils/playerProfile';
import { GAME_NAME, GAME_NAME_FIRST_LINE, GAME_NAME_SECOND_LINE } from '@/constants/gameConfig';
import dayjs from 'dayjs';
import type { GameState } from '@/game/models/gameState';
import Card from '@/components/game/Card.vue';
import Tag from '@/components/ui/tag/Tag.vue';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';

export interface GameResultSummaryProps {
  gameState: GameState;
  summary?: ResultSummary | null;
  variant?: 'short' | 'story';
}

defineOptions({ name: 'GameResultSummary' });

const props = withDefaults(defineProps<GameResultSummaryProps>(), {
  summary: undefined,
  variant: 'short',
});

const resolvedSummary = computed<ResultSummary | null>(() => {
  return props.summary ?? buildResultSummary(props.gameState);
});

const winner = computed(() => {
  const winnerId = props.gameState.winnerPlayerId;
  return winnerId ? props.gameState.players[winnerId] : undefined;
});

const decisivePlay = computed(() => {
  return resolvedSummary.value?.decisivePlay.replace(/^APOIO PERDIDO!\s*/i, '') ?? '';
});

const formattedDuration = computed(() => {
  const seconds = resolvedSummary.value?.durationSeconds;
  return seconds !== null && seconds !== undefined ? durationLabel(seconds) : null;
});

const playerCount = computed(() => {
  return props.gameState.playerOrder?.length ?? Object.keys(props.gameState.players ?? {}).length;
});

const matchDate = computed(() => {
  const timestamp = props.gameState.finishedAt ?? props.gameState.startedAt;
  return timestamp ? dayjs(timestamp).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY');
});

const winnerSupports = computed(() => {
  if (props.gameState.winnerSupports && props.gameState.winnerSupports.length > 0) {
    return props.gameState.winnerSupports;
  }
  return [];
});

/**
 * Obtém dinamicamente o domínio/host do site via window.location com fallback seguro.
 */
const siteUrl = computed(() => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.host || window.location.hostname || 'bastidoresdopoder.com.br';
  }
  return 'bastidoresdopoder.com.br';
});
</script>

<template>
  <!-- Versão Curta (Exibida no final do jogo na mesa do GameBoard) -->
  <div v-if="variant === 'short'" class="result-summary-short space-y-4">
    <header class="gold-divider-bottom relative flex items-center justify-between gap-3 pb-3">
      <div class="flex min-w-0 items-center gap-2">
        <Trophy class="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
        <h2 class="game-section-title">Resultado da mesa</h2>
      </div>
      <Tag variant="primary" size="sm" :aria-label="`Mesa ${gameState.roomCode}`">
        Mesa {{ gameState.roomCode }}
      </Tag>
    </header>

    <div class="result-overview grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)] items-center gap-6 md:gap-8 my-2 md:my-0">
      <div class="result-winner flex items-center gap-4 py-4 md:py-6" role="status">
        <img v-if="winner" :src="playerAvatar(winner)" alt="" class="result-avatar w-16 h-16 md:w-[72px] md:h-[72px] shrink-0 aspect-square object-cover object-[center_25%] border border-gold rounded-lg" width="64" height="64" />
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-gold-muted leading-none mb-1">
            {{ winner ? 'Vencedor da mesa' : 'Partida encerrada' }}
          </p>
          <h3 class="result-name font-serif font-bold text-gold-light text-2xl md:text-3xl leading-tight my-1 break-words">
            <PlayerName :player="winner" fallback="Sessão encerrada sem vencedor" />
          </h3>
          <p v-if="winner" class="text-sm text-ink-muted leading-tight mt-0.5">Conquistou o poder.</p>
        </div>
      </div>

      <dl v-if="resolvedSummary"
        class="result-stats grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-paper/50 text-center">
        <div class="py-2.5 px-1.5 flex flex-col items-center justify-center">
          <dt class="text-[11px] text-ink-muted leading-none">Turnos</dt>
          <dd class="font-serif text-xl font-bold tabular-nums text-ink leading-none mt-1">{{ resolvedSummary.turns }}</dd>
        </div>
        <div class="py-2.5 px-1.5 flex flex-col items-center justify-center">
          <dt class="text-[11px] text-ink-muted leading-none">Apoios</dt>
          <dd class="font-serif text-xl font-bold tabular-nums text-ink leading-none mt-1">{{ resolvedSummary.supports }}</dd>
        </div>
        <div class="py-2.5 px-1.5 flex flex-col items-center justify-center">
          <dt class="text-[11px] text-ink-muted leading-none">Reserva</dt>
          <dd class="font-serif text-xl font-bold tabular-nums text-gold leading-none mt-1">C$ {{ resolvedSummary.coins }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="resolvedSummary" class="result-decision pt-2 md:pt-0">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 class="font-serif text-sm font-semibold text-gold-light">Jogada decisiva</h4>
        <span v-if="formattedDuration"
          class="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 text-xs tabular-nums text-ink-subtle"
          :aria-label="`Duração: ${formattedDuration}`">
          <Clock class="h-3 w-3" aria-hidden="true" />
          {{ formattedDuration }}
        </span>
      </div>
      <p class="break-words text-sm leading-relaxed text-ink-muted">{{ decisivePlay }}</p>
    </div>
  </div>

  <!-- Versão Instagram Stories (Proporção 16:9 vertical / 9:16 - 540x960 px para gerar 1080x1920) -->
  <div v-else
    class="result-summary-story bg-surface p-6 flex flex-col justify-between gap-4 overflow-hidden select-none relative rounded-none border-0 shadow-none w-[540px] h-[960px] min-h-[960px]"
    style="width: 540px; height: 960px; min-height: 960px; max-height: 960px; box-sizing: border-box;">
    <!-- 1. Topo: Identidade do Jogo e Informações da Mesa + Vencedor + Estatísticas + Jogada Decisiva -->
    <div class="flex flex-col gap-4 shrink-0">
      <header class="gold-divider-bottom relative flex items-center justify-between gap-4 pb-4">
        <div class="flex items-center gap-3.5">
          <img src="/images/bdp.webp" :alt="GAME_NAME" class="result-avatar w-16 h-16 shrink-0 aspect-square object-cover drop-shadow" />
          <div class="min-w-0 leading-tight">
            <span
              class="block font-serif font-bold text-2xl tracking-wide text-gold-light uppercase leading-none drop-shadow-sm">
              {{ GAME_NAME_FIRST_LINE }}
            </span>
            <span class="block text-[11px] uppercase tracking-[0.16em] text-gold-muted font-bold mt-1 leading-none">
              {{ GAME_NAME_SECOND_LINE }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Tag variant="primary" size="md" :aria-label="`Mesa ${gameState.roomCode}`">
            Mesa {{ gameState.roomCode }}
          </Tag>
          <Tag variant="primary" size="md">
            {{ matchDate }}
          </Tag>
        </div>
      </header>

      <!-- Overview do Vencedor -->
      <div class="result-winner flex items-center gap-4 w-full p-0 m-0" role="status">
        <img v-if="winner" :src="playerAvatar(winner)" :alt="winner.name" class="w-16 h-16 shrink-0 aspect-square object-cover object-[center_25%] border border-gold rounded-lg" />
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-gold-muted leading-none mb-1">
            {{ winner ? 'Vencedor da mesa' : 'Partida encerrada' }}
          </p>
          <h3 class="result-name font-serif font-bold text-gold-light text-2xl my-0.5 whitespace-normal break-normal leading-tight">
            <PlayerName :player="winner" fallback="Sessão encerrada" />
          </h3>
          <p v-if="winner" class="text-xs text-ink-muted leading-tight mt-0.5">
            Conquistou o poder.
          </p>
        </div>
      </div>

      <!-- Estatísticas da Mesa (Padding ampliado e simétrico via Tailwind) -->
      <dl v-if="resolvedSummary"
        class="result-stats w-full grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-paper/50 text-center m-0">
        <div class="flex flex-col items-center justify-center py-3 px-2">
          <dt class="text-[11px] font-bold uppercase tracking-wider text-ink-muted leading-none">Turnos</dt>
          <dd class="font-serif text-2xl font-bold tabular-nums text-ink leading-none mt-2">
            {{ resolvedSummary.turns }}
          </dd>
        </div>
        <div class="flex flex-col items-center justify-center py-3 px-2">
          <dt class="text-[11px] font-bold uppercase tracking-wider text-ink-muted leading-none">Apoios</dt>
          <dd class="font-serif text-2xl font-bold tabular-nums text-ink leading-none mt-2">
            {{ resolvedSummary.supports }}
          </dd>
        </div>
        <div class="flex flex-col items-center justify-center py-3 px-2">
          <dt class="text-[11px] font-bold uppercase tracking-wider text-ink-muted leading-none">Reserva</dt>
          <dd class="font-serif text-2xl font-bold tabular-nums text-gold leading-none mt-2">
            C$ {{ resolvedSummary.coins }}
          </dd>
        </div>
      </dl>

      <!-- Jogada Decisiva (Registro de Ata Oficial da Sessão) -->
      <div v-if="resolvedSummary"
        class="result-decision rounded-lg border border-line-gold/50 bg-surface-elevated/70 p-3.5 shadow-sm relative overflow-hidden m-0">
        <div class="flex items-center justify-between gap-2 pb-1 border-b border-line/50">
          <h4 class="font-serif text-[11px] font-bold text-gold-light uppercase leading-none">
            Jogada Decisiva
          </h4>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 text-[11px] text-ink-subtle">
              <div class="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-gold-muted">
                <Users class="w-3 h-3 text-gold-muted" aria-hidden="true" />
                <span>{{ playerCount }} participantes</span>
              </div>
            </div>
            <div v-if="formattedDuration"
              class="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-gold-muted"
              :aria-label="`Duração: ${formattedDuration}`">
              <Clock class="h-3 w-3 text-gold/70" aria-hidden="true" />
              <span>{{ formattedDuration }}</span>
            </div>
          </div>
        </div>
        <p class="text-xs leading-relaxed text-ink/90 font-medium pt-1.5">
          {{ decisivePlay }}
        </p>
      </div>
    </div>

    <!-- 2. Cartas de Apoio do Gabinete Vencedor (Integradas imediatamente abaixo da jogada decisiva) -->
    <div class="story-cabinet-section w-full flex-1 flex flex-col items-center justify-center min-h-0">
      <div v-if="winnerSupports.length > 0" class="grid w-full gap-3 sm:gap-3.5 items-center justify-center"
        :class="winnerSupports.length === 1 ? 'grid-cols-1 max-w-[200px]' : 'grid-cols-2 max-w-[400px]'">
        <div v-for="card in winnerSupports" :key="card.id"
          class="cabinet-card relative block w-full bg-paper-deep rounded-xl overflow-hidden shadow-card border border-line-gold/50 p-0">
          <Card :role="card.roleSlug" />
        </div>
      </div>

      <div v-else class="text-xs text-ink-muted py-4 text-center">
        Gabinete consolidado sem apoios remanescentes.
      </div>
    </div>

    <!-- 3. Rodapé Oficial da Mesa (Chamada oficial colada no padding inferior) -->
    <footer class="gold-divider-top relative pt-4 pb-0 flex flex-col shrink-0 w-full [&>header]:mb-0">
      <AppSectionHeader label="Nova sessão" title="A próxima mesa é sua?"
        description="Convoque seus amigos e dispute o controle político."
        class="mb-0">
        <div class="mt-4 flex">
          <Tag variant="primary" size="md" class="gap-2 px-3.5 py-1.5 border-gold-dark shadow-sm">
            <Globe class="w-3.5 h-3.5 text-gold shrink-0" aria-hidden="true" />
            <span class="font-serif font-bold text-gold-light tracking-wide text-xs">{{ siteUrl }}</span>
          </Tag>
        </div>
      </AppSectionHeader>
    </footer>
  </div>
</template>