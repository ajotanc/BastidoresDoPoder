<script setup lang="ts">
import Card from '@/components/game/Card.vue';
import { ref, computed } from 'vue';
import type { RoleSlug } from '@/types/game';
import type { GameState, PrivatePlayerView, PublicPlayerState } from '@/game/models/gameState';
import type { ActionIntent, BlockIntent } from '@/game/models/commands';
import { useGameTimer } from '@/composables/useGameTimer';
import { getRoleDisplayName, getActionDisplayName } from '@/game/engine/gameEngine';
import { getEligibleBlockRoles } from '@/game/engine/rules';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import {
  ShieldCheck,
  Scale,
  Trophy,
  Flame,
  Gavel,
  FolderLock,
  BookOpen,
  Copy,
  Check,
  LogOut,
  X,
} from 'lucide-vue-next';
import PlantaoNoticias from './PlantaoNoticias.vue';
import ActionSelectorModal from './ActionSelectorModal.vue';
import CardChoiceModal from './CardChoiceModal.vue';
import ExchangeModal from './ExchangeModal.vue';

interface Props {
  gameState: GameState;
  privateView: PrivatePlayerView | null;
  myPlayerId: string;
  isHost: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'declare-action', intent: ActionIntent): void;
  (e: 'declare-block', blockIntent: BlockIntent): void;
  (e: 'declare-challenge', isBlockChallenge: boolean): void;
  (e: 'pass-response'): void;
  (e: 'choose-card', cardId: string): void;
  (e: 'choose-exchange', returnedCardIds: readonly [string, string]): void;
  (e: 'leave'): void;
}>();

const isActionModalOpen = ref(false);

const deadlineRef = computed(() => props.gameState.deadlineAt);
const { secondsRemaining, progressPercentage, isUrgent } = useGameTimer(deadlineRef);

const myPublicPlayer = computed<PublicPlayerState | null>(() => {
  return props.gameState.players[props.myPlayerId] || null;
});

const isMyTurn = computed(() => {
  return (
    props.gameState.activePlayerId === props.myPlayerId &&
    props.gameState.phase === 'WAITING_ACTION' &&
    (myPublicPlayer.value?.isAlive ?? false)
  );
});

const opponents = computed(() => {
  return props.gameState.playerOrder
    .filter((id) => id !== props.myPlayerId)
    .map((id) => props.gameState.players[id])
    .filter((p): p is PublicPlayerState => !!p);
});

const activePlayer = computed(() => {
  return props.gameState.players[props.gameState.activePlayerId] || null;
});

const pending = computed(() => {
  return props.gameState.pendingAction;
});

const isChoicePendingForMe = computed(() => {
  return (
    props.gameState.phase === 'WAITING_CARD_CHOICE' &&
    props.gameState.cardChoicePlayerId === props.myPlayerId
  );
});

const isExchangePendingForMe = computed(() => {
  return (
    props.gameState.phase === 'WAITING_EXCHANGE_CHOICE' &&
    props.gameState.cardChoicePlayerId === props.myPlayerId
  );
});

const isMyResponse = computed(() => props.gameState.responsePlayerIds[0] === props.myPlayerId);
const respondingPlayer = computed(() => props.gameState.players[props.gameState.responsePlayerIds[0] || '']);
const possibleBlockRoles = computed(() => pending.value ? getEligibleBlockRoles(props.gameState, pending.value, props.myPlayerId) : []);
const canIBlock = computed(() => isMyResponse.value && possibleBlockRoles.value.length > 0);

const allPlayableRoles = PLAYABLE_ROLES;

const roleDiscardCounts = computed(() => {
  const counts: Record<RoleSlug, number> = {
    colonel: 0,
    executor: 0,
    untouchable: 0,
    lawyer: 0,
    baron: 0,
    marketer: 0,
    investigator: 0,
    coordinator: 0,
    guide: 0,
  };

  for (const card of props.gameState.discard) {
    counts[card.roleSlug]++;
  }

  return counts;
});

const totalDiscarded = computed(() => props.gameState.discard.length);

const handleDeclareBlock = (role: RoleSlug): void => {
  emit('declare-block', { claimedBlockRole: role });
};

const copiedLinkNotice = ref(false);

const copyGameLink = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.navigator?.clipboard) {
      const shareUrl = `${window.location.origin}/game/${props.gameState.roomCode}`;
      await window.navigator.clipboard.writeText(shareUrl);
      copiedLinkNotice.value = true;
      window.setTimeout(() => {
        copiedLinkNotice.value = false;
      }, 2000);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('Erro ao copiar link:', err.message);
    }
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
    <!-- Barra Superior da Mesa -->
    <header class="bg-surface border border-line-gold/40 rounded-2xl px-6 py-3.5 shadow-card flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-serif uppercase tracking-wider text-ink-subtle">Turno</span>
          <span class="font-serif font-black text-gold text-lg">#{{ gameState.turn }}</span>
        </div>
        <div class="h-4 w-px bg-line/60"></div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-ink-muted">Ação de:</span>
          <span class="font-semibold text-ink" :class="{ 'text-gold-light': isMyTurn }">
            {{ activePlayer?.name }} {{ isMyTurn ? '(Você)' : '' }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="copyGameLink"
          class="text-xs text-ink-muted hover:text-gold flex items-center gap-1.5 bg-paper-deep px-3 py-1.5 rounded-lg border border-line hover:border-gold/40 transition-colors shadow-xs"
          title="Copiar link direto da partida (/game/:id)"
        >
          <template v-if="copiedLinkNotice">
            <Check class="w-3.5 h-3.5 text-status-green" aria-hidden="true" />
            <span class="text-status-green font-semibold">Link Copiado!</span>
          </template>
          <template v-else>
            <Copy class="w-3.5 h-3.5 text-gold-light" aria-hidden="true" />
            <span>Mesa: <strong class="text-gold font-bold">{{ gameState.roomCode }}</strong></span>
          </template>
        </button>

        <button
          type="button"
          @click="emit('leave')"
          class="text-xs font-medium text-ink-muted hover:text-status-red transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-paper-deep border border-transparent hover:border-line"
        >
          <LogOut class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </header>

    <!-- Barra de Tensão e Contagem Regressiva do Host -->
    <div v-if="gameState.deadlineAt && secondsRemaining > 0" class="space-y-1">
      <div class="flex items-center justify-between text-xs px-1">
        <span class="font-serif font-semibold text-ink-subtle flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full" :class="isUrgent ? 'bg-status-red animate-ping' : 'bg-gold'"></span>
          Tempo de Resolução:
        </span>
        <span class="font-bold tracking-wider" :class="isUrgent ? 'text-status-red animate-pulse' : 'text-gold'">
          00:{{ secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining }}s
        </span>
      </div>
      <div class="w-full h-1.5 bg-paper-deep rounded-full overflow-hidden border border-line/40">
        <div
          class="h-full transition-all duration-100 rounded-full"
          :class="isUrgent ? 'bg-status-red' : 'bg-gold'"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Gabinetes Rivais (Adversários) -->
    <section aria-label="Gabinetes Adversários" class="space-y-3">
      <h2 class="text-xs font-serif uppercase tracking-wider text-ink-subtle font-bold px-1">
        Gabinetes Rivais na Disputa
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        <article
          v-for="opp in opponents"
          :key="opp.id"
          class="p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
          :class="[
            !opp.isAlive
              ? 'opacity-40 bg-paper-deep/60 border-line/30'
              : opp.id === gameState.activePlayerId
              ? 'bg-gold/10 border-gold shadow-md ring-1 ring-gold/40'
              : pending?.targetPlayerId === opp.id
              ? 'bg-status-red-bg border-status-red animate-pulse'
              : 'bg-surface border-line/60'
          ]"
        >
          <!-- Cabeçalho do Oponente -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-full bg-surface-elevated border border-gold/40 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  :src="`/images/characters/${opp.avatarSlug}.webp`"
                  :alt="opp.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  onerror="this.src='/images/icons/guide.webp'"
                />
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-sm text-ink truncate">{{ opp.name }}</h3>
                <span class="text-[11px] text-ink-muted block truncate">
                  {{ opp.isAlive ? getRoleDisplayName(opp.avatarSlug) : 'CASSADO / ELIMINADO' }}
                </span>
              </div>
            </div>

            <!-- Moedas do Oponente -->
            <div class="flex items-center gap-1 bg-paper-deep px-2 py-1 rounded-md border border-line shrink-0">
              <img src="/images/coins/gold.webp" alt="Contos" class="w-3.5 h-3.5 object-contain" />
              <span class="font-bold text-xs text-gold">C$ {{ opp.coins }}</span>
            </div>
          </div>

          <!-- Apoios do Oponente: Ativos (virados para baixo) e Revelados (virados para cima) -->
          <div class="pt-3 border-t border-line/40 space-y-3">
            <!-- Apoios Ativos (Secretos) - Maior tamanho e fácil visualização -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-serif uppercase tracking-wider text-ink-subtle">
                  Apoios Ativos:
                </span>
                <span
                  class="text-[11px] font-bold px-1.5 py-0.2 rounded"
                  :class="[
                    opp.activeSupportCount > 1
                      ? 'bg-gold/15 text-gold-light border border-gold/30'
                      : opp.activeSupportCount === 1
                      ? 'bg-status-red-bg text-status-red border border-status-red/40 animate-pulse'
                      : 'text-ink-subtle'
                  ]"
                >
                  {{ opp.activeSupportCount }} {{ opp.activeSupportCount === 1 ? 'carta restante' : 'cartas restantes' }}
                </span>
              </div>

              <div class="flex items-center gap-2 pt-0.5">
                <div
                  v-for="i in opp.activeSupportCount"
                  :key="i"
                  class="w-11 h-16 sm:w-12 sm:h-18 rounded-lg border-2 border-line-gold/70 overflow-hidden shadow-md bg-paper-deep transition-transform hover:scale-105"
                  title="Apoio Político Secreto"
                >
                  <Card face-down />
                </div>
                <span v-if="opp.activeSupportCount === 0" class="text-xs text-status-red font-semibold py-1">
                  Nenhum apoio ativo (Eliminado)
                </span>
              </div>
            </div>

            <!-- Apoios Revelados / Eliminados (Visíveis para toda a mesa) -->
            <div v-if="opp.lostCards && opp.lostCards.length > 0" class="pt-2 border-t border-line/30 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-bold tracking-wider text-status-red flex items-center gap-1.5">
                  <Scale class="w-3.5 h-3.5 text-status-red shrink-0" aria-hidden="true" />
                  <span>Apoios Cassados ({{ opp.lostCards.length }}):</span>
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="lost in opp.lostCards"
                  :key="lost.id"
                  class="flex items-center gap-2 bg-paper-deep/90 border border-status-red/40 rounded-lg p-1.5 shadow-sm"
                  :title="`Carta revelada: ${getRoleDisplayName(lost.roleSlug)} — Motivo: ${lost.reason}`"
                >
                  <div class="relative w-8 h-12 rounded overflow-hidden border border-status-red/60 shrink-0">
                    <Card :role="lost.roleSlug" />
                    <div class="absolute inset-0 bg-status-red/20 flex items-center justify-center">
                      <X class="w-3.5 h-3.5 text-status-red font-bold" aria-hidden="true" />
                    </div>
                  </div>
                  <div class="min-w-0 flex flex-col">
                    <span class="text-[11px] font-serif font-bold text-ink truncate line-through decoration-status-red/80">
                      {{ getRoleDisplayName(lost.roleSlug) }}
                    </span>
                    <span class="text-[9px] text-status-red uppercase font-semibold truncate">
                      {{ lost.reason || 'Eliminado' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Centro da Mesa: Plantão de Notícias + Deliberações de Ação/Reação -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Coluna da Esquerda: Feed de Notícias dos Bastidores -->
      <div class="lg:col-span-6">
        <PlantaoNoticias :history="gameState.history" />
      </div>

      <!-- Coluna da Direita: Palco de Deliberações e Reações -->
      <div class="lg:col-span-6 space-y-4">
        <!-- 1. Quando há Ação Declarada em Aberto -->
        <div
          v-if="pending"
          class="bg-surface border border-gold/40 rounded-2xl p-5 shadow-card space-y-4 relative overflow-hidden"
        >
          <div class="flex items-center justify-between border-b border-line/40 pb-3">
            <span class="font-serif font-bold text-xs uppercase tracking-wider text-gold-light">
              Manobra em Julgamento
            </span>
            <span class="text-xs text-ink-muted">
              {{ gameState.phase.replace(/_/g, ' ') }}
            </span>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-semibold text-ink">
              {{ gameState.players[pending.sourcePlayerId]?.name }} declarou:
            </p>
            <p class="text-base font-serif font-bold text-gold">
              {{ getActionDisplayName(pending.actionType) }}
            </p>
            <p v-if="pending.targetPlayerId" class="text-xs text-ink-muted">
              Alvo visado: <strong class="text-ink">{{ gameState.players[pending.targetPlayerId]?.name }}</strong>
            </p>
            <p v-if="pending.claimedRole" class="text-xs text-ink-subtle">
              Alega possuir o apoio de: <strong class="text-gold-light">{{ getRoleDisplayName(pending.claimedRole) }}</strong>
            </p>
            <div v-if="pending.blockedByPlayerId && pending.claimedBlockRole" class="flex items-center gap-1.5 text-xs text-status-red font-semibold pt-1">
              <ShieldCheck class="w-4 h-4 text-status-green shrink-0" aria-hidden="true" />
              <span>Bloqueado por {{ gameState.players[pending.blockedByPlayerId]?.name }} alegando {{ getRoleDisplayName(pending.claimedBlockRole) }}.</span>
            </div>
          </div>

          <p v-if="respondingPlayer && !isMyResponse" class="text-xs text-ink-muted" role="status">
            Aguardando a resposta de {{ respondingPlayer.name }} na ordem da mesa.
          </p>
          <!-- Resposta em ordem horária -->
          <!-- Janela de Contestação de Ação ("Fake News!") -->
          <div v-if="gameState.phase === 'WAITING_CHALLENGE_ACTION' && isMyResponse" class="space-y-2.5 pt-2 border-t border-line/40">
            <p class="text-xs text-ink font-medium">
              Você desconfia dessa alegação?
            </p>
            <div class="flex items-center gap-3">
              <button
                v-if="pending.sourcePlayerId !== myPlayerId"
                type="button"
                @click="emit('declare-challenge', false)"
                class="flex-1 py-3 px-4 rounded-xl bg-status-red hover:bg-status-red/90 text-paper-deep font-serif font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
              >
                <Flame class="w-4 h-4" aria-hidden="true" />
                <span>Contestar Alegação (Fake News)</span>
              </button>
              <button
                type="button"
                @click="emit('pass-response')"
                class="py-3 px-5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-line text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                Passar / Permitir
              </button>
            </div>
          </div>

          <!-- Janela de Bloqueio -->
          <div v-if="gameState.phase === 'WAITING_BLOCK' && canIBlock" class="space-y-2.5 pt-2 border-t border-line/40">
            <p class="text-xs text-ink font-medium">
              Você pode declarar bloqueio alegando cargo de defesa:
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="role in possibleBlockRoles"
                :key="role"
                type="button"
                @click="handleDeclareBlock(role)"
                class="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-paper-deep font-serif font-bold text-xs uppercase tracking-wider transition-all"
              >
                Bloquear como {{ getRoleDisplayName(role) }}
              </button>
              <button
                type="button"
                @click="emit('pass-response')"
                class="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-line text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                Não Bloquear
              </button>
            </div>
          </div>

          <!-- Janela de Contestação de Bloqueio -->
          <div v-if="gameState.phase === 'WAITING_CHALLENGE_BLOCK' && isMyResponse" class="space-y-2.5 pt-2 border-t border-line/40">
            <p class="text-xs text-ink font-medium">
              Contestar a alegação de defesa do bloqueador?
            </p>
            <div class="flex items-center gap-3">
              <button
                v-if="pending.blockedByPlayerId !== myPlayerId"
                type="button"
                @click="emit('declare-challenge', true)"
                class="flex-1 py-3 px-4 rounded-xl bg-status-red hover:bg-status-red/90 text-paper-deep font-serif font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
              >
                <Flame class="w-4 h-4" aria-hidden="true" />
                <span>Contestar Bloqueio (Fake News)</span>
              </button>
              <button
                type="button"
                @click="emit('pass-response')"
                class="py-3 px-5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-line text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                Aceitar Bloqueio
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Quando é o Seu Turno para Declarar -->
        <div
          v-else-if="isMyTurn"
          class="bg-surface border-2 border-gold/60 rounded-2xl p-6 shadow-card space-y-4 text-center md:text-left"
        >
          <div class="space-y-1">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold/20 text-gold-light">
              Sua Vez de Jogar
            </span>
            <h3 class="font-serif font-bold text-lg text-ink">
              Gabinete Presidencial Ativo
            </h3>
            <p class="text-xs text-ink-muted max-w-md">
              Declare uma manobra econômica, acione habilidades de personagens ou execute um golpe constitucional.
            </p>
          </div>

          <button
            type="button"
            @click="isActionModalOpen = true"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-paper-deep font-serif font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-gold/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Escolher Ação do Turno</span>
            <Gavel class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- 3. Aguardando outro jogador -->
        <div v-else class="bg-surface/50 border border-line/50 rounded-2xl p-6 text-center space-y-2">
          <p class="text-xs font-serif uppercase tracking-wider text-ink-subtle">
            Sessão em Andamento
          </p>
          <p class="text-sm text-ink-muted">
            Aguardando deliberação de <strong>{{ activePlayer?.name }}</strong>...
          </p>
        </div>
      </div>
    </section>

    <!-- Zona Inferior: Seu Gabinete Pessoal & Apoios Secretos (Dossiê Confidencial) -->
    <section
      aria-label="Seu Gabinete Pessoal"
      class="bg-surface border border-line-gold/50 rounded-2xl p-6 shadow-card space-y-4 relative overflow-hidden"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line-gold/30 pb-3">
        <div class="flex items-center gap-2.5">
          <FolderLock class="w-4 h-4 text-gold-light" aria-hidden="true" />
          <div>
            <h2 class="font-serif font-bold text-sm text-gold-light tracking-wide">
              Seu Gabinete — Dossiê Confidencial
            </h2>
            <p class="text-[11px] text-ink-muted">
              Seus Apoios são secretos e visíveis exclusivamente para você.
            </p>
          </div>
        </div>

        <!-- Saldo de Contos do Jogador -->
        <div class="flex items-center gap-2 bg-paper-deep px-3 py-1.5 rounded-xl border border-line-gold/40">
          <img src="/images/coins/gold.webp" alt="Moeda de Ouro" class="w-5 h-5 object-contain" />
          <div class="flex flex-col">
            <span class="text-[9px] uppercase tracking-wider text-ink-subtle font-semibold">Reserva</span>
            <span class="font-bold text-sm text-gold leading-none">C$ {{ myPublicPlayer?.coins ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Suas Cartas de Apoio -->
      <p v-if="privateView?.searchResultNotice" class="text-sm text-ink-muted" role="status">
        {{ privateView.searchResultNotice }}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="card in privateView?.supports || []"
          :key="card.id"
          class="rounded-xl border overflow-hidden transition-all flex flex-col bg-paper-deep relative group"
          :class="[
            card.isLost
              ? 'opacity-40 border-line/40 grayscale'
              : 'border-line-gold/40 hover:border-gold shadow-md'
          ]"
        >
          <div class="w-full aspect-[2/3] bg-surface-elevated overflow-hidden relative">
            <Card :role="card.roleSlug" />
            <div
              v-if="card.isLost"
              class="absolute inset-0 bg-paper-deep/80 flex items-center justify-center text-status-red font-serif font-black text-xs uppercase tracking-widest border border-status-red"
            >
              CASSADO
            </div>
          </div>

          <div class="p-2.5 flex items-center justify-between bg-surface/80 border-t border-line/40">
            <span class="font-serif font-bold text-xs text-ink">
              {{ getRoleDisplayName(card.roleSlug) }}
            </span>
            <span
              class="text-[10px] font-semibold px-1.5 py-0.2 rounded border"
              :class="card.isLost ? 'bg-status-red-bg border-status-red/40 text-status-red' : 'bg-gold/15 border-gold/30 text-gold-light'"
            >
              {{ card.isLost ? 'Perdido' : 'Ativo' }}
            </span>
          </div>
        </div>

        <div v-if="!privateView || privateView.supports.length === 0" class="text-xs text-ink-muted py-4 col-span-full text-center">
          Carregando apoios secretos...
        </div>
      </div>
    </section>

    <!-- Painel de Contabilidade da Mesa: Apoios que Já Saíram (Estratégia e Contagem) -->
    <section
      aria-label="Contabilidade de Apoios que Já Saíram"
      class="bg-surface/90 border border-line-gold/40 rounded-2xl p-5 sm:p-6 shadow-card space-y-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/40 pb-3">
        <div class="flex items-center gap-2">
          <BookOpen class="w-4 h-4 text-gold-light" aria-hidden="true" />
          <div>
            <h2 class="font-serif font-bold text-sm text-gold-light tracking-wide">
              Contabilidade da Mesa — Cartas que Já Saíram
            </h2>
            <p class="text-[11px] text-ink-muted">
              Existem estritamente 3 cartas de cada personagem em todo o jogo (24 cartas). Use este painel para deduzir blefes e cartas restantes.
            </p>
          </div>
        </div>

        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-deep border border-line text-ink-muted self-start sm:self-auto">
          {{ totalDiscarded }} / 24 reveladas
        </span>
      </div>

      <!-- Grade dos 8 Personagens com Contagem de Saídas (X / 3) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div
          v-for="role in allPlayableRoles"
          :key="role"
          class="p-2.5 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all text-center"
          :class="[
            roleDiscardCounts[role] >= 3
              ? 'bg-status-red-bg/40 border-status-red/50 shadow-inner'
              : roleDiscardCounts[role] > 0
              ? 'bg-paper-deep border-line-gold/40'
              : 'bg-paper-deep/50 border-line/40 opacity-70'
          ]"
        >
          <div class="w-8 h-8 rounded-full overflow-hidden border border-line shrink-0">
            <img
              :src="`/images/characters/${role}.webp`"
              :alt="getRoleDisplayName(role)"
              class="w-full h-full object-cover"
              loading="lazy"
              onerror="this.src='/images/icons/guide.webp'"
            />
          </div>

          <span class="text-[11px] font-serif font-bold text-ink truncate w-full">
            {{ getRoleDisplayName(role) }}
          </span>

          <div class="flex items-center gap-1">
            <span
              class="text-xs font-bold"
              :class="[
                roleDiscardCounts[role] >= 3
                  ? 'text-status-red font-black'
                  : roleDiscardCounts[role] > 0
                  ? 'text-gold'
                  : 'text-ink-subtle'
              ]"
            >
              {{ roleDiscardCounts[role] }} / 3
            </span>
            <span v-if="roleDiscardCounts[role] >= 3" class="text-[9px] bg-status-red text-paper-deep px-1 rounded font-bold uppercase">
              Fim
            </span>
          </div>
        </div>
      </div>

      <!-- Fita Detalhada de Histórico de Cartas Reveladas -->
      <div v-if="gameState.discard.length > 0" class="pt-3 border-t border-line/30 space-y-2">
        <span class="text-[10px] uppercase font-bold tracking-wider text-ink-subtle block">
          Últimos Apoios Revelados e Cassados:
        </span>
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <div
            v-for="revealed in gameState.discard"
            :key="revealed.id"
            class="flex items-center gap-2 bg-paper-deep border border-status-red/30 rounded-lg p-1.5 pr-3 shrink-0 shadow-sm"
          >
            <div class="w-6 shrink-0 grayscale opacity-85"><Card :role="revealed.roleSlug" /></div>
            <div class="flex flex-col text-left">
              <span class="text-xs font-serif font-bold text-ink leading-tight">
                {{ getRoleDisplayName(revealed.roleSlug) }}
              </span>
              <span class="text-[10px] text-ink-muted">
                {{ gameState.players[revealed.lostByPlayerId]?.name || 'Jogador' }}
              </span>
              <span class="text-[9px] text-status-red uppercase font-semibold">
                {{ revealed.reason }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de Vitória / Encerramento da Partida -->
    <div
      v-if="gameState.phase === 'FINISHED'"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-deep/90 backdrop-blur-md animate-fadeIn"
    >
      <div class="w-full max-w-md bg-surface border-2 border-gold rounded-2xl p-8 shadow-modal text-center space-y-6">
        <Trophy class="w-16 h-16 text-gold mx-auto animate-bounce drop-shadow-md" aria-hidden="true" />
        <div class="space-y-2">
          <span class="text-xs font-serif uppercase tracking-widest text-gold font-bold">
            Poder Supremo Conquistado
          </span>
          <h2 class="font-serif font-black text-2xl text-ink">
            {{ gameState.players[gameState.winnerPlayerId || '']?.name || 'Grande Vencedor' }}
          </h2>
          <p class="text-xs text-ink-muted">
            Eliminou todos os gabinetes rivais e assumiu a liderança incontestável dos Bastidores do Poder!
          </p>
        </div>

        <button
          type="button"
          @click="emit('leave')"
          class="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-paper-deep font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          Voltar ao Início
        </button>
      </div>
    </div>

    <!-- Modais Auxiliares -->
    <ActionSelectorModal
      :is-open="isActionModalOpen"
      :my-coins="myPublicPlayer?.coins ?? 0"
      :my-player-id="myPlayerId"
      :players="gameState.players"
      :player-order="gameState.playerOrder"
      @close="isActionModalOpen = false"
      @declare="(intent) => emit('declare-action', intent)"
    />

    <CardChoiceModal
      :is-open="isChoicePendingForMe"
      :my-supports="privateView?.supports || []"
      :reason="gameState.cardChoiceReason"
      @choose="(cardId) => emit('choose-card', cardId)"
    />

    <ExchangeModal
      :is-open="isExchangePendingForMe"
      :my-supports="privateView?.supports || []"
      @choose-exchange="(ids) => emit('choose-exchange', ids)"
    />
  </div>
</template>
