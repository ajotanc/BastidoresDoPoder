<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import PlayerName from '@/components/online/PlayerName.vue';
import { useGameSounds } from '@/composables/useGameSounds';
import { useVictoryCelebration } from '@/composables/useVictoryCelebration';
import { Volume2, VolumeX, ImageDown } from '@lucide/vue';
import { Toggle } from '@/components/ui/toggle';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/sonner';
import { shareResult } from '@/utils/shareResult';
import { buildResultSummary, type ResultSummary } from '@/game/resultSummary';
import GameResultSummary from '@/components/game/GameResultSummary.vue';
import DiscordConversation from './DiscordConversation.vue';
import { playerAvatar } from "@/utils/playerProfile";
import GameResultBanner from './GameResultBanner.vue';
import Card from '@/components/game/Card.vue';
import { ref, computed, watch } from 'vue';
import type { RoleCard, RoleSlug } from '@/types/game';
import type { GameState, PrivatePlayerView, PublicPlayerState } from '@/game/models/gameState';
import { copyText } from '@/utils/clipboard';
import { DEFAULT_GAME_SETTINGS } from '@/game/models/gameState';
import type { ActionIntent, BlockIntent } from '@/game/models/commands';
import { useGameTimer } from '@/composables/useGameTimer';
import { useLightbox } from '@/composables/useLightbox';
import { useDragScroll } from '@/composables/useDragScroll';
import { useCabinetFollow } from '@/composables/useCabinetFollow';
import { useDeveloperMode } from '@/composables/useDeveloperMode';
import { ROLE_CARDS } from '@/constants/gameData';
import { getRoleDisplayName, getActionDisplayName } from '@/game/engine/gameEngine';
import { getEligibleBlockRoles, getEligibleChallengers } from '@/game/engine/rules';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import {
  ShieldCheck,
  Flame,
  Gavel,
  FolderLock,
  BookOpen,
  Copy,
  Check,
  LogOut,
  Coins,
  Radio,
  Landmark,
  Users,
  Clock,
} from '@lucide/vue';
import GameNewsFeed from './GameNewsFeed.vue';
import ActionSelectorModal from './ActionSelectorModal.vue';
import CardChoiceModal from './CardChoiceModal.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tag } from '@/components/ui/tag';
import { Info } from '@lucide/vue';
import ExchangeModal from './ExchangeModal.vue';

interface Props {
  gameState: GameState;
  privateView: PrivatePlayerView | null;
  myPlayerId: string;
  isHost: boolean;
}

const props = defineProps<Props>();
const sounds = useGameSounds(computed(() => props.gameState), computed(() => props.myPlayerId));
useVictoryCelebration(computed(() => props.gameState));
const { isDeveloper } = useDeveloperMode();
const rivalDrag = useDragScroll();
const rivalsContainer = ref<HTMLElement | null>(null);
const touchingRivals = ref(false);
useCabinetFollow(rivalsContainer, computed(() => props.gameState), computed(() => props.myPlayerId), computed(() => rivalDrag.isDragging.value || touchingRivals.value));
const revealedDrag = useDragScroll();
const recentRevealedCards = computed(() => [...props.gameState.discard].reverse());
const revealedWinnerCards = ref(new Set<string>());
const winnerSupportAt = (player: PublicPlayerState, slot: number) =>
  props.gameState.phase === 'FINISHED' && props.gameState.winnerPlayerId === player.id
    ? props.gameState.winnerSupports?.[slot - 1 - player.lostCards.length]
    : undefined;
const revealWinnerSupport = (player: PublicPlayerState, slot: number) => {
  const card = winnerSupportAt(player, slot);
  if (!card) return;
  if (revealedWinnerCards.value.has(card.id)) handleInspectCard(card.roleSlug);
  else revealedWinnerCards.value.add(card.id);
};
const rivalSupportAt = (player: PublicPlayerState, slot: number) =>
  player.lostCards[slot - 1] ?? winnerSupportAt(player, slot);
const isRivalSupportHidden = (player: PublicPlayerState, slot: number) => {
  if (player.lostCards[slot - 1]) return false;
  const winnerCard = winnerSupportAt(player, slot);
  return !winnerCard || !revealedWinnerCards.value.has(winnerCard.id);
};
const inspectRivalSupport = (player: PublicPlayerState, slot: number) => {
  const lostCard = player.lostCards[slot - 1];
  if (lostCard) handleInspectCard(lostCard.roleSlug);
  else revealWinnerSupport(player, slot);
};

const emit = defineEmits<{
  (e: 'retry-conversation'): void;
  (e: 'declare-action', intent: ActionIntent): void;
  (e: 'declare-block', blockIntent: BlockIntent): void;
  (e: 'declare-challenge', isBlockChallenge: boolean): void;
  (e: 'pass-response'): void;
  (e: 'choose-card', cardId: string): void;
  (e: 'choose-exchange', returnedCardIds: readonly [string, string]): void;
  (e: 'leave'): void;
  (e: 'play-again'): void;
}>();

const { openCardLightbox } = useLightbox();

const isActionModalOpen = ref(false);
watch(() => props.gameState.phase, phase => {
  if (phase !== 'WAITING_ACTION') isActionModalOpen.value = false;
});
const isFinished = computed(() => props.gameState.phase === 'FINISHED');
const winner = computed(() => props.gameState.players[props.gameState.winnerPlayerId ?? '']);
const phaseLabel = computed(() => ({ WAITING_CHALLENGE_ACTION: 'Contestar ação', WAITING_BLOCK: 'Bloquear ação', WAITING_CHALLENGE_BLOCK: 'Contestar bloqueio', WAITING_CARD_CHOICE: 'Escolher apoio', WAITING_EXCHANGE_CHOICE: 'Trocar apoios' }[props.gameState.phase as string] || 'Em andamento'));
const secondaryMobileTab = ref<'plantao' | 'contabilidade'>('plantao');

const deadlineRef = computed(() => props.gameState.deadlineAt);
const durationRef = computed(() => {
  const settings = props.gameState.settings ?? DEFAULT_GAME_SETTINGS;
  if (props.gameState.phase === 'WAITING_ACTION') return settings.actionTimeoutMs;
  if (props.gameState.phase === 'WAITING_BLOCK') return settings.reactionTimeoutMs;
  if (['WAITING_CARD_CHOICE', 'WAITING_EXCHANGE_CHOICE'].includes(props.gameState.phase)) return settings.choiceTimeoutMs;
  return settings.challengeTimeoutMs;
});
const { secondsRemaining, progressPercentage, isUrgent } = useGameTimer(deadlineRef, durationRef);

const timerLabel = computed(() => [Math.floor(secondsRemaining.value / 60), secondsRemaining.value % 60].map(value => String(value).padStart(2, '0')).join(':'));

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
const canIChallenge = computed(() => !!pending.value && isMyResponse.value && getEligibleChallengers(props.gameState, pending.value, props.gameState.phase === 'WAITING_CHALLENGE_BLOCK').includes(props.myPlayerId));
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

const handleInspectCard = (role: RoleSlug): void => {
  const roleCard = ROLE_CARDS.find((c: RoleCard) => c.slug === role);
  if (roleCard) {
    openCardLightbox(roleCard);
  }
};

const copiedLinkNotice = ref(false);

const copyGameLink = async (): Promise<void> => {
  try {
    const shareUrl = `${window.location.origin}/room/${props.gameState.roomCode}`;
    if (await copyText(shareUrl)) {
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

const storyPreviewRef = ref<HTMLElement | null>(null);
const isGeneratingPreview = ref(false);

const previewGameState = computed<GameState>(() => {
  if (props.gameState.phase === 'FINISHED' && props.gameState.winnerPlayerId) {
    return props.gameState;
  }
  const fallbackWinnerId = props.gameState.winnerPlayerId || props.myPlayerId || Object.keys(props.gameState.players)[0] || '';
  return {
    ...props.gameState,
    phase: 'FINISHED',
    winnerPlayerId: fallbackWinnerId,
    winnerSupports: props.gameState.winnerSupports ?? [
      { id: 'preview-sup-1', roleSlug: 'baron' },
      { id: 'preview-sup-2', roleSlug: 'colonel' },
    ],
    history: props.gameState.history.length > 0 ? props.gameState.history : [
      { id: 'preview-h-1', type: 'GAME_FINISHED', message: 'Partida finalizada com sucesso.', timestamp: Date.now(), importance: 'alert' },
      { id: 'preview-h-2', type: 'ACTION_DECLARED', message: 'Golpe decisivo consolidado no plenário.', timestamp: Date.now(), importance: 'normal' },
    ],
  };
});

const previewSummary = computed<ResultSummary>(() => {
  const fallbackWinnerId = props.gameState.winnerPlayerId || props.myPlayerId || Object.keys(props.gameState.players)[0] || '';
  return buildResultSummary(previewGameState.value) ?? {
    gameId: 'preview-game-1',
    winnerName: props.gameState.players[fallbackWinnerId]?.name || 'Vencedor',
    finishedAt: Date.now(),
    roomCode: props.gameState.roomCode,
    turns: props.gameState.turn || 8,
    supports: 2,
    coins: props.gameState.players[props.myPlayerId]?.coins ?? 5,
    durationSeconds: 245,
    decisivePlay: 'Impeachment Definitivo desarticulou o último gabinete adversário.',
  };
});

/**
 * Gera e baixa a imagem de Stories diretamente para pré-visualização rápida durante os ajustes.
 */
async function generateStoryPreview(): Promise<void> {
  if (isGeneratingPreview.value) return;
  if (!storyPreviewRef.value) {
    toast.error('Elemento do Stories não encontrado.');
    return;
  }

  isGeneratingPreview.value = true;
  try {
    const message = await shareResult(previewSummary.value, storyPreviewRef.value);
    if (message) {
      toast.success(message);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Não foi possível gerar a imagem.';
    toast.error(errorMsg);
  } finally {
    isGeneratingPreview.value = false;
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn">
    <!-- 1. Barra de Status da Mesa (Compacta e Sticky-Friendly) -->
    <header class="game-status overflow-hidden rounded-lg border border-line-gold/50 bg-surface shadow-card">
      <div class="flex items-center justify-between gap-3 gold-divider-bottom relative px-4 py-2.5 sm:px-5">
        <div class="flex items-center gap-2 min-w-0">
          <Landmark class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
          <h2 class="game-section-title">Mesa {{ gameState.roomCode }}</h2>
        </div>
        <div class="flex items-center gap-1.5">
          <Toggle variant="transparent" size="icon" :pressed="sounds.enabled.value"
            :aria-label="sounds.enabled.value ? 'Desativar sons' : 'Ativar sons'"
            :title="sounds.enabled.value ? 'Desativar sons' : 'Ativar sons'" @update:pressed="sounds.toggle">
            <component :is="sounds.enabled.value ? Volume2 : VolumeX" class="h-4 w-4" aria-hidden="true" />
          </Toggle>
          <AppButton variant="transparent" size="icon" v-if="isDeveloper" :disabled="isGeneratingPreview"
            :title="isGeneratingPreview ? 'Gerando Stories...' : 'Gerar imagem do Stories (Preview)'"
            :aria-label="isGeneratingPreview ? 'Gerando Stories...' : 'Gerar imagem do Stories'"
            @click="generateStoryPreview">
            <Spinner v-if="isGeneratingPreview" size="sm" aria-hidden="true" />
            <ImageDown v-else class="h-4 w-4" aria-hidden="true" />
          </AppButton>
          <DiscordConversation v-if="gameState.discordConversation" :conversation="gameState.discordConversation"
            :can-retry="isHost" @retry="emit('retry-conversation')" compact />
          <AppButton variant="transparent" size="icon" @click="copyGameLink"
            :title="copiedLinkNotice ? 'Link copiado' : 'Copiar link direto da partida'"
            :aria-label="copiedLinkNotice ? 'Link copiado' : 'Copiar link direto da partida'">
            <Check v-if="copiedLinkNotice" class="h-4 w-4 text-status-green" aria-hidden="true" />
            <Copy v-else class="h-4 w-4" aria-hidden="true" />
          </AppButton>
          <AppButton variant="transparent" size="icon" @click="emit('leave')" title="Abandonar partida"
            aria-label="Sair">
            <LogOut class="h-4 w-4" aria-hidden="true" />
          </AppButton>
        </div>
      </div>
      <!-- Linhas de separação entre Turno e Jogador Ativo -->
      <div class="grid grid-cols-12 divide-x divide-line">
        <div class="col-span-4 p-3.5 sm:p-4 flex flex-col justify-center">
          <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gold-muted">Rodada</span>
          <span class="font-serif text-sm sm:text-base font-bold text-gold-light">Turno {{ gameState.turn }}</span>
        </div>
        <div class="col-span-8 p-3.5 sm:p-4 flex flex-col justify-center min-w-0">
          <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-ink-muted truncate">{{
            isFinished ? 'Resultado final' : isMyTurn ? 'Sua vez de decidir' : 'No comando da rodada' }}</span>
          <strong class="font-serif text-sm sm:text-base font-bold text-ink break-words block">
            <PlayerName :player="isFinished ? winner : activePlayer"
              :fallback="isFinished ? 'Sem vencedor' : undefined" />
          </strong>
        </div>
      </div>
      <!-- Linha de separação e contagem regressiva integrada -->
      <div v-if="gameState.deadlineAt && secondsRemaining > 0"
        class="border-t border-line bg-paper-deep/40 px-4 py-2.5 sm:px-5 space-y-1.5">
        <div class="flex items-center justify-between text-sm">
          <span class="game-section-title !text-ink-subtle text-xs sm:text-sm">
            {{ gameState.phase === 'WAITING_ACTION' ? 'Tempo da jogada' : 'Tempo de resolução' }}
          </span>
          <span data-testid="game-timer" class="font-semibold text-sm sm:text-base tabular-nums tracking-wider"
            :class="isUrgent ? 'text-status-red animate-pulse' : 'text-gold'">
            {{ timerLabel }}
          </span>
        </div>
        <div class="w-full h-1.5 bg-paper-deep rounded-full overflow-hidden border border-line/40">
          <div class="h-full transition-all duration-100 rounded-full" :class="isUrgent ? 'bg-status-red' : 'bg-gold'"
            :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </header>

    <!-- 2. PALCO PRINCIPAL DE DELIBERAÇÃO / SUA VEZ (Topo no mobile para máxima usabilidade!) -->
    <section aria-label="Deliberações e Ações da Mesa" class="space-y-3">
      <GameResultBanner v-if="isFinished" :game-state="gameState" :is-host="isHost" @play-again="emit('play-again')" />
      <!-- Caso A: Quando há Ação Declarada em Aberto -->
      <div v-else-if="pending"
        class="bg-surface border border-line border-l-4 border-l-gold rounded p-4 sm:p-5 shadow-card space-y-3.5 relative overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 gold-divider-bottom relative pb-2.5">
          <h3 class="game-section-title flex items-center gap-2">
            <Radio class="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
            <span>Jogada em análise</span>
          </h3>
          <Tag variant="dark" size="sm">
            {{ phaseLabel }}
          </Tag>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-ink-muted"><strong class="text-ink">{{ gameState.players[pending.sourcePlayerId]?.name
          }}</strong> declarou</p>
          <h3 class="font-serif text-lg font-semibold text-gold-light">{{ getActionDisplayName(pending.actionType) }}
          </h3>
          <p v-if="pending.targetPlayerId" class="text-xs text-ink-muted">
            Alvo visado: <strong class="text-ink font-semibold">{{ gameState.players[pending.targetPlayerId]?.name
            }}</strong>
          </p>
          <p v-if="pending.claimedRole" class="text-xs text-ink-subtle">
            Alega possuir o cargo de: <strong class="text-gold-light font-semibold">{{
              getRoleDisplayName(pending.claimedRole) }}</strong>
          </p>
          <div v-if="pending.blockedByPlayerId && pending.claimedBlockRole"
            class="flex items-center gap-1.5 text-xs text-status-red font-semibold pt-1">
            <ShieldCheck class="w-4 h-4 text-status-green shrink-0" aria-hidden="true" />
            <span>Bloqueado por {{ gameState.players[pending.blockedByPlayerId]?.name }} alegando {{
              getRoleDisplayName(pending.claimedBlockRole) }}.</span>
          </div>
        </div>

        <Alert v-if="respondingPlayer && !isMyResponse" variant="secondary">
          <Clock class="h-4 w-4" />
          <AlertDescription>
            Aguardando deliberação de <strong>{{ respondingPlayer.name }}</strong> na ordem da mesa.
          </AlertDescription>
        </Alert>
        <!-- Janela de Contestação de Ação ("Fake News!") -->
        <p v-if="pending.targetPlayerId && gameState.phase === 'WAITING_CHALLENGE_ACTION'"
          class="text-xs text-ink-muted">Qualquer outro jogador ativo pode contestar esta ação.</p>
        <p v-if="pending.targetPlayerId && gameState.phase === 'WAITING_CHALLENGE_BLOCK'"
          class="text-xs text-ink-muted">Qualquer outro jogador ativo pode contestar esta defesa.</p>
        <div v-if="gameState.phase === 'WAITING_CHALLENGE_ACTION' && canIChallenge"
          class="space-y-2.5 pt-2.5 border-t border-line/40">
          <div class="flex items-center gap-1.5 text-xs text-ink font-semibold">
            <span>Você desconfia dessa alegação política?</span>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <AppButton variant="danger" class="flex-1 text-xs" v-if="pending.sourcePlayerId !== myPlayerId"
              @click="emit('declare-challenge', false)">
              <Flame class="w-4 h-4" aria-hidden="true" />
              <span>Contestar Alegação (Fake News!)</span>
            </AppButton>
            <AppButton variant="secondary" class="text-xs font-semibold" @click="emit('pass-response')">
              Passar / Permitir
            </AppButton>
          </div>
        </div>

        <!-- Janela de Bloqueio -->
        <div v-if="gameState.phase === 'WAITING_BLOCK' && canIBlock" class="space-y-2.5 pt-2.5 border-t border-line/40">
          <p class="text-xs text-ink font-semibold">
            Você tem direito a declarar bloqueio em sua defesa:
          </p>
          <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap">
            <AppButton variant="gold" class="w-full text-xs sm:w-auto" v-for="role in possibleBlockRoles" :key="role"
              @click="handleDeclareBlock(role)">
              Bloquear como {{ getRoleDisplayName(role) }}
            </AppButton>
            <AppButton variant="secondary" class="w-full text-xs font-semibold sm:w-auto"
              @click="emit('pass-response')">
              Não Bloquear
            </AppButton>
          </div>
        </div>

        <!-- Janela de Contestação de Bloqueio -->
        <div v-if="gameState.phase === 'WAITING_CHALLENGE_BLOCK' && canIChallenge"
          class="space-y-2.5 pt-2.5 border-t border-line/40">
          <p class="text-xs text-ink font-semibold">
            Contestar a alegação de defesa do bloqueador?
          </p>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <AppButton variant="danger" class="flex-1 text-xs" v-if="pending.blockedByPlayerId !== myPlayerId"
              @click="emit('declare-challenge', true)">
              <Flame class="w-4 h-4" aria-hidden="true" />
              <span>Contestar Bloqueio (Fake News!)</span>
            </AppButton>
            <AppButton variant="secondary" class="text-xs font-semibold" @click="emit('pass-response')">
              Aceitar Bloqueio
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Caso B: Quando é a Sua Vez de Declarar -->
      <div v-else-if="isMyTurn"
        class="bg-surface border border-line border-l-4 border-l-gold rounded p-4 sm:p-6 shadow-card space-y-3.5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-sm font-semibold text-gold">A decisão é sua</p>
          <h3 class="font-serif font-bold text-base sm:text-lg text-ink">
            Escolha sua próxima jogada
          </h3>
          <p class="text-sm text-ink-muted max-w-md">
            Receba moedas, use seus personagens ou ataque um rival.
          </p>
        </div>

        <AppButton variant="gold" class="w-full px-6 sm:w-auto sm:px-8 shrink-0" @click="isActionModalOpen = true">
          <span>Escolher Ação do Turno</span>
          <Gavel class="w-4 h-4" aria-hidden="true" />
        </AppButton>
      </div>

      <!-- Caso C: Sessão em Andamento aguardando outro jogador -->
      <div v-else
        class="bg-surface border border-line border-l-4 border-l-gold/50 rounded p-4 sm:p-5 text-left flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <Clock class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
              <h3 class="game-section-title">Sessão em Andamento</h3>
            </div>
            <p class="text-xs sm:text-sm text-ink-muted">
              Aguardando deliberação de <strong class="text-ink">{{ activePlayer?.name }}</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. SEU GABINETE PESSOAL & APOIOS SECRETOS (Dossiê Confidencial - Cartas Lado a Lado no Mobile) -->
    <section aria-label="Seu Gabinete Pessoal"
      class="bg-surface border border-line-gold/50 rounded p-4 sm:p-6 shadow-card space-y-3.5 relative overflow-hidden"
      :class="{ 'cabinet-winner': isFinished && gameState.winnerPlayerId === myPlayerId }">
      <div class="flex items-center justify-between gap-3 gold-divider-bottom relative pb-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <FolderLock class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
          <div class="min-w-0">
            <h2 class="game-section-title">
              Seu Gabinete
            </h2>
          </div>
        </div>

        <!-- Saldo de Contos do Jogador -->
        <Tag variant="dark-gold" size="md" class="gap-2 shrink-0">
          <Coins class="w-4 h-4 text-gold" aria-hidden="true" />
          <div class="flex flex-col">
            <span class="text-[9px] uppercase tracking-wider text-ink-subtle font-semibold leading-none">Reserva</span>
            <span class="font-bold text-sm text-gold leading-none">C$ {{ myPublicPlayer?.coins ?? 0 }}</span>
          </div>
        </Tag>
      </div>

      <!-- Suas Cartas de Apoio: Em Mobile 2 colunas lado a lado! Perfeito para caber na tela sem rolagem -->
      <Alert v-if="privateView?.searchResultNotice" variant="warning">
        <Info class="h-4 w-4" />
        <AlertDescription>
          {{ privateView.searchResultNotice }}
        </AlertDescription>
      </Alert>




      <div class="mx-auto grid max-w-lg grid-cols-2 gap-3 sm:gap-4">
        <button v-for="card in privateView?.supports || []" :key="card.id" type="button"
          :aria-label="`Ampliar carta ${getRoleDisplayName(card.roleSlug)}${card.isLost ? ' (apoio perdido)' : ''}`"
          class="cabinet-card relative block w-full min-w-0 bg-paper-deep transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
          @click="handleInspectCard(card.roleSlug)" :class="[
            card.isLost
              ? 'opacity-60 grayscale'
              : 'hover:ring-2 hover:ring-gold/60'
          ]">
          <Card :role="card.roleSlug" />
          <div v-if="card.isLost"
            class="absolute inset-0 rounded-[inherit] bg-paper-deep/85 flex items-center justify-center text-status-red font-serif font-black text-xs uppercase tracking-widest border border-status-red">
            CASSADO
          </div>
        </button>

        <div v-if="!privateView || privateView.supports.length === 0"
          class="text-xs text-ink-muted py-6 col-span-full text-center">
          Carregando apoios secretos do gabinete...
        </div>
      </div>
    </section>

    <!-- 4. GABINETES RIVAIS (Adversários: Faixa Horizontal Rolável no Mobile, Grid no Desktop) -->
    <section aria-label="Gabinetes Adversários" class="space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
          <h2 class="game-section-title">
            Gabinetes Rivais
          </h2>
        </div>
        <div v-if="opponents.length > 2" class="flex items-center gap-1 text-sm text-ink-muted">
          <span>Deslize para o lado</span>
          <span>→</span>
        </div>
      </div>

      <!-- Container adaptativo: carrossel horizontal suave no mobile, grid no tablet/desktop -->
      <div ref="rivalsContainer"
        class="rivals-carousel drag-scroll grid grid-flow-col gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
        @touchstart.passive="touchingRivals = true" @touchend.passive="touchingRivals = false"
        @touchcancel.passive="touchingRivals = false" @pointerdown="rivalDrag.onPointerDown"
        @pointermove="rivalDrag.onPointerMove" @pointerup="rivalDrag.onPointerEnd"
        @pointercancel="rivalDrag.onPointerEnd" @lostpointercapture="rivalDrag.onPointerEnd"
        @pointerleave="rivalDrag.onPointerLeave" @click.capture="rivalDrag.onClickCapture" @dragstart.prevent>
        <article v-for="opp in opponents" :key="opp.id" :data-cabinet-id="opp.id"
          class="min-w-0 snap-start p-2 sm:p-4 rounded sm:rounded border transition-all flex flex-col gap-3 relative overflow-hidden bg-surface"
          :class="[
            isFinished && gameState.winnerPlayerId === opp.id
              ? 'cabinet-winner'
              : !opp.isAlive
                ? 'bg-paper-deep/60 border-line/30'
                : opp.id === gameState.activePlayerId
                  ? 'bg-gold/10 border-gold shadow-md ring-1 ring-gold/40'
                  : pending?.targetPlayerId === opp.id
                    ? 'bg-status-red-bg border-status-red ring-2 ring-status-red/50 animate-pulse'
                    : 'border-line/60'
          ]">
          <!-- Cabeçalho do Oponente -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-1 flex-col items-start gap-2">
              <div class="flex items-center justify-between">
                <div
                  class="w-8 h-8 rounded bg-surface-elevated border border-gold/40 flex items-center justify-center overflow-hidden shrink-0">
                  <img :src="playerAvatar(opp)" :alt="opp.name" class="w-full h-full object-cover" loading="lazy"
                    onerror="this.src='/images/icons/guide.webp'" />
                </div>
                <!-- Moedas do Oponente -->
                <Tag variant="dark" size="sm" class="shrink-0 gap-1 text-gold font-bold">
                  <Coins class="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                  <span>C$ {{ opp.coins }}</span>
                </Tag>
              </div>
              <div class="min-w-0">
                <h3 class="w-full font-semibold text-sm text-ink break-words leading-relaxed">
                  <PlayerName :player="opp" />
                </h3>
                <span v-if="!opp.isConnected && opp.isAlive && gameState.phase !== 'FINISHED'"
                  class="block text-xs text-status-red">Reconectando…</span>
                <span v-if="!opp.isAlive || (!opp.avatarImage && opp.avatarSlug)"
                  class="text-[10px] text-ink-muted block truncate">
                  {{ opp.isAlive && opp.avatarSlug ? getRoleDisplayName(opp.avatarSlug) : 'CASSADO' }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-auto pt-3 border-t border-line/40 space-y-2">
            <p class="text-xs text-ink-muted">{{ opp.activeSupportCount }} {{ opp.activeSupportCount === 1 ? 'apoio ativo' : 'apoios ativos' }}</p>
            <div class="grid max-w-50 grid-cols-2 gap-2">
              <div v-for="slot in 2" :key="slot" class="rival-support"
                :class="{ 'is-revealed': !!opp.lostCards[slot - 1] }">
                <div class="rival-support-inner">
                  <button type="button" class="rival-support-front" :aria-disabled="!rivalSupportAt(opp, slot)"
                    :tabindex="rivalSupportAt(opp, slot) ? 0 : -1"
                    :aria-label="opp.lostCards[slot - 1] ? `Ver apoio perdido: ${getRoleDisplayName(opp.lostCards[slot - 1]!.roleSlug)}` : winnerSupportAt(opp, slot) ? `${isRivalSupportHidden(opp, slot) ? 'Revelar' : 'Ampliar'} apoio ${slot} do vencedor ${opp.name}` : `Apoio secreto de ${opp.name}`"
                    :title="opp.lostCards[slot - 1]?.reason" @click="inspectRivalSupport(opp, slot)">
                    <Card :role="rivalSupportAt(opp, slot)?.roleSlug" :face-down="isRivalSupportHidden(opp, slot)" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 5. PAINEL SECUNDÁRIO: PLANTÃO & CONTABILIDADE (Abas no Mobile para economia vertical, Lado a Lado no Desktop) -->
    <section aria-label="Histórico e Contabilidade" class="space-y-3">
      <!-- Abas no Mobile -->
      <div class="secondary-tabs flex lg:hidden items-center gap-1 bg-paper-deep rounded p-1">
        <button type="button" @click="secondaryMobileTab = 'plantao'"
          class="flex-1 py-2 rounded text-xs font-sans font-bold tracking-normal transition-all flex items-center justify-center gap-1.5"
          :class="[
            secondaryMobileTab === 'plantao'
              ? 'bg-surface-elevated text-gold shadow-sm'
              : 'text-ink-muted hover:text-ink'
          ]">
          <Radio class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Plantão</span>
        </button>
        <button type="button" @click="secondaryMobileTab = 'contabilidade'"
          class="flex-1 py-2 rounded text-xs font-sans font-bold tracking-normal transition-all flex items-center justify-center gap-1.5"
          :class="[
            secondaryMobileTab === 'contabilidade'
              ? 'bg-surface-elevated text-gold shadow-sm'
              : 'text-ink-muted hover:text-ink'
          ]">
          <BookOpen class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Contabilidade</span>
        </button>
      </div>

      <!-- Container do Conteúdo -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        <!-- Plantão de Notícias (Visível sempre no desktop; no mobile apenas se aba 'plantao' ativa) -->
        <div aria-label="Histórico da partida" class="lg:col-span-6 w-full lg:relative"
          :class="{ 'hidden lg:block': secondaryMobileTab !== 'plantao' }">
          <div class="lg:absolute lg:inset-0 h-full">
            <GameNewsFeed class="h-full" :history="gameState.history" :is-finished="isFinished" />
          </div>
        </div>

        <!-- Painel de Contabilidade de Cartas Descartadas (Visível sempre no desktop; no mobile se 'contabilidade' ativa) -->
        <div
          class="lg:col-span-6 w-full flex flex-col bg-surface/90 border border-line-gold/40 rounded sm:rounded p-4 sm:p-5 shadow-card space-y-3"
          :class="{ 'hidden lg:block': secondaryMobileTab !== 'contabilidade' }">
          <header class="mb-4 flex flex-wrap items-center justify-between gap-2 gold-divider-bottom relative pb-2.5">
            <div class="flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
              <h2 class="game-section-title">
                Cartas reveladas
              </h2>
            </div>
            <span class="text-xs text-gold-muted tabular-nums">
              {{ totalDiscarded }} / 24
            </span>
          </header>

          <!-- Grade dos 8 Personagens com Contagem de Saídas (X / 3) -->
          <div class="grid grid-cols-2 gap-3">
            <div v-for="role in allPlayableRoles" :key="role"
              class="p-2 rounded border flex flex-col items-center justify-between gap-1 transition-all text-center"
              :class="[
                roleDiscardCounts[role] >= 3
                  ? 'bg-status-red-bg/40 border-status-red/50 shadow-inner'
                  : roleDiscardCounts[role] > 0
                    ? 'bg-paper-deep border-line-gold/40'
                    : 'bg-paper-deep/50 border-line/40 opacity-70'
              ]">
              <div class="w-12 h-12 rounded overflow-hidden border border-line shrink-0">
                <img :src="`/images/characters/${role}.webp`" :alt="getRoleDisplayName(role)"
                  class="w-full h-full object-cover" loading="lazy" onerror="this.src='/images/icons/guide.webp'" />
              </div>

              <span class="text-sm font-sans font-semibold text-ink w-full">
                {{ getRoleDisplayName(role) }}
              </span>

              <span class="text-[11px] font-bold" :class="[
                roleDiscardCounts[role] >= 3
                  ? 'text-status-red font-black'
                  : roleDiscardCounts[role] > 0
                    ? 'text-gold'
                    : 'text-ink-subtle'
              ]">
                {{ roleDiscardCounts[role] }}/3
              </span>
            </div>
          </div>

          <!-- Fita Histórica de Descartes Recentes -->
          <section v-if="gameState.discard.length > 0" aria-label="Últimos apoios revelados"
            class="min-w-0 pt-4 border-t border-line/50 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="game-section-title">Últimos apoios revelados</h3>
              <span v-if="recentRevealedCards.length > 0" class="text-sm text-ink-muted">Arraste para explorar →</span>
            </div>
            <div
              class="revealed-carousel drag-scroll grid grid-flow-col auto-cols-[100%] sm:auto-cols-[320px] gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
              @pointerdown="revealedDrag.onPointerDown" @pointermove="revealedDrag.onPointerMove"
              @pointerup="revealedDrag.onPointerEnd" @pointercancel="revealedDrag.onPointerEnd"
              @lostpointercapture="revealedDrag.onPointerEnd" @pointerleave="revealedDrag.onPointerLeave"
              @click.capture="revealedDrag.onClickCapture" @dragstart.prevent>
              <article v-for="revealed in recentRevealedCards" :key="revealed.id"
                class="flex min-w-0 items-start gap-3 bg-paper-deep/70 border border-line rounded p-3 snap-start">
                <button type="button"
                  class="revealed-card w-20 shrink-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  :aria-label="`Ampliar apoio revelado: ${getRoleDisplayName(revealed.roleSlug)}`"
                  @click="handleInspectCard(revealed.roleSlug)">
                  <Card :role="revealed.roleSlug" />
                </button>
                <div class="min-w-0 text-left">
                  <h4 class="font-serif text-sm font-bold text-gold-light leading-snug">
                    {{ getRoleDisplayName(revealed.roleSlug) }}
                  </h4>
                  <p class="break-words text-sm font-semibold leading-snug text-ink">
                    {{ gameState.players[revealed.lostByPlayerId]?.name || 'Jogador' }}
                  </p>
                  <p class="break-words border-t border-line/50 pt-2 mt-3 text-xs leading-relaxed text-ink-muted">{{
                    revealed.reason }}</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>

    <!-- Modais Auxiliares -->
    <ActionSelectorModal :is-open="isActionModalOpen" :my-coins="myPublicPlayer?.coins ?? 0" :my-player-id="myPlayerId"
      :players="gameState.players" :player-order="gameState.playerOrder" @close="isActionModalOpen = false"
      @declare="(intent) => emit('declare-action', intent)" />

    <CardChoiceModal :is-open="isChoicePendingForMe" :my-supports="privateView?.supports || []"
      :reason="gameState.cardChoiceReason" @choose="(cardId) => emit('choose-card', cardId)" />

    <ExchangeModal :is-open="isExchangePendingForMe" :my-supports="privateView?.supports || []"
      @choose-exchange="(ids) => emit('choose-exchange', ids)" />

    <!-- Contêiner oculto para teste e geração do Stories em tempo real -->
    <div class="fixed -left-[99999px] top-0 pointer-events-none opacity-0" aria-hidden="true" inert>
      <div ref="storyPreviewRef">
        <GameResultSummary :game-state="previewGameState" :summary="previewSummary" variant="story" />
      </div>
    </div>
  </div>
</template>

<style scoped>
button.cabinet-card {
  padding: 0;
  border: 0;
  border-radius: var(--ui-radius);
  cursor: zoom-in;
}
</style>
