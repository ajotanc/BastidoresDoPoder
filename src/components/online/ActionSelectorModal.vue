<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RoleSlug } from '@/types/game';
import type { ActionType, PublicPlayerState } from '@/game/models/gameState';
import type { ActionIntent } from '@/game/models/commands';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getActionCost, getRoleDisplayName } from '@/game/engine/gameEngine';

interface Props {
  isOpen: boolean;
  myCoins: number;
  myPlayerId: string;
  players: Record<string, PublicPlayerState>;
  playerOrder: readonly string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'declare', intent: ActionIntent): void;
}>();

const selectedAction = ref<ActionType | null>(null);
const selectedTargetId = ref<string>('');
const selectedNamedRole = ref<RoleSlug>('colonel');

const isMustImpeach = computed(() => {
  return props.myCoins >= 10;
});

const aliveOpponents = computed(() => {
  return props.playerOrder
    .filter((id) => id !== props.myPlayerId)
    .map((id) => props.players[id])
    .filter((p): p is PublicPlayerState => !!p && p.isAlive);
});

const requiresTarget = computed(() => {
  if (!selectedAction.value) return false;
  return [
    'extortion',
    'execution',
    'searchWarrant',
    'backroomDeal',
    'commonImpeachment',
    'definitiveImpeachment',
  ].includes(selectedAction.value);
});

const requiresNamedRole = computed(() => {
  return selectedAction.value === 'searchWarrant';
});

const canAfford = (action: ActionType): boolean => {
  const cost = getActionCost(action);
  return props.myCoins >= cost;
};

const selectAction = (action: ActionType): void => {
  if (isMustImpeach.value && action !== 'definitiveImpeachment') return;
  if (!canAfford(action)) return;

  selectedAction.value = action;
  if (requiresTarget.value && !selectedTargetId.value && aliveOpponents.value[0]) {
    selectedTargetId.value = aliveOpponents.value[0].id;
  }
};

const handleConfirm = (): void => {
  if (!selectedAction.value) return;

  const intent: ActionIntent = {
    actionType: selectedAction.value,
    targetPlayerId: requiresTarget.value ? selectedTargetId.value : undefined,
    namedRole: requiresNamedRole.value ? selectedNamedRole.value : undefined,
    secondaryPlayerId: selectedAction.value === 'backroomDeal' ? selectedTargetId.value : undefined,
  };

  emit('declare', intent);
  emit('close');
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-deep/80 backdrop-blur-md animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="action-modal-title"
  >
    <div class="w-full max-w-2xl bg-surface border border-line-gold/50 rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Cabeçalho do Modal -->
      <div class="px-6 py-4 bg-paper-deep border-b border-line-gold/30 flex items-center justify-between">
        <div>
          <h2 id="action-modal-title" class="font-serif font-bold text-lg text-gold-light tracking-wide">
            Gabinete de Ação — Seu Turno
          </h2>
          <p class="text-xs text-ink-muted">
            Seu saldo em cofre: <span class="font-bold text-gold">C$ {{ myCoins }}</span>
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="text-ink-muted hover:text-ink text-sm p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <!-- Alerta de Impeachment Obrigatório se C$ >= 10 -->
      <div v-if="isMustImpeach" class="px-6 py-3 bg-status-red-bg border-b border-status-red/40 flex items-center gap-3">
        <span class="text-lg">⚖️</span>
        <p class="text-xs text-status-red font-medium">
          <strong>Aviso Constitucional Obrigatório:</strong> Você acumulou C$ 10 ou mais. O regimento exige a declaração imediata de <strong>Impeachment Definitivo</strong>.
        </p>
      </div>

      <!-- Conteúdo de Ações -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        <!-- 1. Receitas Básicas -->
        <div v-if="!isMustImpeach">
          <h3 class="text-xs font-serif uppercase tracking-wider text-ink-subtle font-bold mb-2.5">
            Receitas do Gabinete
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              @click="selectAction('salary')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'salary'
                  ? 'bg-gold/15 border-gold shadow-sm'
                  : 'bg-surface-elevated/70 border-line hover:border-gold/40'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Salário Oficial</span>
                <span class="text-xs font-bold text-gold">+C$ 1</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Receba C$ 1 do cofre. Ação direta, sem bloqueios ou contestações.
              </p>
            </button>

            <button
              type="button"
              @click="selectAction('crowdfunding')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'crowdfunding'
                  ? 'bg-gold/15 border-gold shadow-sm'
                  : 'bg-surface-elevated/70 border-line hover:border-gold/40'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Vaquinha Virtual</span>
                <span class="text-xs font-bold text-gold">+C$ 2</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Arrecade C$ 2. Qualquer jogador pode alegar Barão para bloquear.
              </p>
            </button>
          </div>
        </div>

        <!-- 2. Manobras de Personagens -->
        <div v-if="!isMustImpeach">
          <h3 class="text-xs font-serif uppercase tracking-wider text-ink-subtle font-bold mb-2.5">
            Manobras com Alegação de Cargo (Desafiáveis por "Fake News!")
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Caixa 2 -->
            <button
              type="button"
              @click="selectAction('slushFund')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'slushFund'
                  ? 'bg-gold/15 border-gold'
                  : 'bg-surface-elevated/70 border-line hover:border-gold/40'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Caixa 2 (Barão)</span>
                <span class="text-xs font-bold text-gold">+C$ 3</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Receba C$ 3 do cofre central alegando possuir o Barão.
              </p>
            </button>

            <!-- Extorsão -->
            <button
              type="button"
              @click="selectAction('extortion')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'extortion'
                  ? 'bg-gold/15 border-gold'
                  : 'bg-surface-elevated/70 border-line hover:border-gold/40'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Extorsão (Coronel)</span>
                <span class="text-xs font-bold text-gold">Até C$ 2</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Exija até C$ 2 de um adversário. Bloqueável por Coronel ou Marqueteira.
              </p>
            </button>

            <!-- Execução -->
            <button
              type="button"
              :disabled="!canAfford('execution')"
              @click="selectAction('execution')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'execution'
                  ? 'bg-gold/15 border-gold'
                  : canAfford('execution')
                  ? 'bg-surface-elevated/70 border-line hover:border-gold/40'
                  : 'opacity-40 cursor-not-allowed bg-surface/40 border-line/30'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Execução (Executor)</span>
                <span class="text-xs font-bold text-status-red">-C$ 3</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Pague C$ 3 para forçar um rival a perder 1 Apoio. Bloqueável por Advogada.
              </p>
            </button>

            <!-- Mandado de Busca -->
            <button
              type="button"
              :disabled="!canAfford('searchWarrant')"
              @click="selectAction('searchWarrant')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'searchWarrant'
                  ? 'bg-gold/15 border-gold'
                  : canAfford('searchWarrant')
                  ? 'bg-surface-elevated/70 border-line hover:border-gold/40'
                  : 'opacity-40 cursor-not-allowed bg-surface/40 border-line/30'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Mandado de Busca</span>
                <span class="text-xs font-bold text-status-red">-C$ 5</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Aponte um rival e nomeie um personagem. Se ele tiver, o apoio é apreendido.
              </p>
            </button>

            <!-- Acordo de Bastidor -->
            <button
              type="button"
              @click="selectAction('backroomDeal')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'backroomDeal'
                  ? 'bg-gold/15 border-gold'
                  : 'bg-surface-elevated/70 border-line hover:border-gold/40'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Acordo de Bastidor</span>
                <span class="text-xs font-bold text-gold">+C$ 2 / +C$ 1</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Receba C$ 2 e conceda C$ 1 para um aliado (ambos do cofre). Sem bloqueio.
              </p>
            </button>
          </div>
        </div>

        <!-- 3. Golpes Parlamentares -->
        <div>
          <h3 class="text-xs font-serif uppercase tracking-wider text-ink-subtle font-bold mb-2.5">
            Golpes Parlamentares & Impeachment
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Impeachment Comum -->
            <button
              type="button"
              :disabled="isMustImpeach || !canAfford('commonImpeachment')"
              @click="selectAction('commonImpeachment')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'commonImpeachment'
                  ? 'bg-gold/15 border-gold'
                  : !isMustImpeach && canAfford('commonImpeachment')
                  ? 'bg-surface-elevated/70 border-line hover:border-gold/40'
                  : 'opacity-40 cursor-not-allowed bg-surface/40 border-line/30'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-ink">Impeachment Comum</span>
                <span class="text-xs font-bold text-status-red">-C$ 7</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Pague C$ 7 para cassar 1 Apoio de um rival. Bloqueável por Intocável (pagando C$ 3).
              </p>
            </button>

            <!-- Impeachment Definitivo -->
            <button
              type="button"
              :disabled="!canAfford('definitiveImpeachment')"
              @click="selectAction('definitiveImpeachment')"
              class="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between"
              :class="[
                selectedAction === 'definitiveImpeachment'
                  ? 'bg-status-red-bg border-status-red shadow-md'
                  : canAfford('definitiveImpeachment')
                  ? 'bg-surface-elevated/70 border-status-red/50 hover:border-status-red'
                  : 'opacity-40 cursor-not-allowed bg-surface/40 border-line/30'
              ]"
            >
              <div class="flex items-center justify-between w-full mb-1">
                <span class="font-semibold text-sm text-status-red">Impeachment Definitivo</span>
                <span class="text-xs font-bold text-status-red">-C$ 10</span>
              </div>
              <p class="text-xs text-ink-muted leading-relaxed">
                Pague C$ 10. Elimina 1 Apoio do rival sem chance de bloqueio ou contestação!
              </p>
            </button>
          </div>
        </div>

        <!-- Parâmetros Adicionais (Alvo e/ou Personagem Nomeado) -->
        <div v-if="requiresTarget" class="p-4 bg-paper-deep rounded-xl border border-line space-y-3">
          <label class="block text-xs font-serif font-bold text-gold-light uppercase tracking-wider">
            Selecione o Gabinete Alvo:
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="opp in aliveOpponents"
              :key="opp.id"
              type="button"
              @click="selectedTargetId = opp.id"
              class="p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
              :class="[
                selectedTargetId === opp.id
                  ? 'bg-gold/20 border-gold text-ink font-semibold'
                  : 'bg-surface-elevated border-line text-ink-muted hover:border-gold/30'
              ]"
            >
              <span class="text-xs truncate">{{ opp.name }}</span>
            </button>
          </div>

          <!-- Nomeação de Personagem no Mandado de Busca -->
          <div v-if="requiresNamedRole" class="pt-2 border-t border-line/50 space-y-2">
            <label class="block text-xs font-serif font-bold text-gold-light uppercase tracking-wider">
              Nomeie o Cargo sob Investigação:
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                v-for="role in PLAYABLE_ROLES"
                :key="role"
                type="button"
                @click="selectedNamedRole = role"
                class="px-2.5 py-1.5 rounded-md border text-xs text-center transition-all truncate"
                :class="[
                  selectedNamedRole === role
                    ? 'bg-gold/20 border-gold text-ink font-bold'
                    : 'bg-surface-elevated border-line text-ink-muted hover:border-gold/30'
                ]"
              >
                {{ getRoleDisplayName(role) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé com Botão de Confirmação -->
      <div class="px-6 py-4 bg-paper-deep border-t border-line-gold/30 flex items-center justify-end gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!selectedAction || (requiresTarget && !selectedTargetId)"
          @click="handleConfirm"
          class="px-5 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all"
          :class="[
            selectedAction && (!requiresTarget || selectedTargetId)
              ? 'bg-gold hover:bg-gold-light text-paper-deep shadow-md active:scale-95'
              : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
          ]"
        >
          Declarar no Plenário
        </button>
      </div>
    </div>
  </div>
</template>
