<script setup lang="ts">
import { playerAvatar } from "@/utils/playerProfile";
import AppDialog from '@/components/ui/AppDialog.vue';
import { ref, computed, watch } from 'vue';
import type { RoleSlug } from '@/types/game';
import type { ActionType, PublicPlayerState } from '@/game/models/gameState';
import type { ActionIntent } from '@/game/models/commands';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getActionCost, getRoleDisplayName } from '@/game/engine/gameEngine';
import { X } from 'lucide-vue-next';

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

type ActionCategory = 'all' | 'basic' | 'roles' | 'coups';

const activeCategory = ref<ActionCategory>('all');
const selectedAction = ref<ActionType | null>(null);
const selectedTargetId = ref<string>('');
const selectedNamedRole = ref<RoleSlug>('colonel');

const isMustImpeach = computed(() => props.myCoins >= 10);

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

const requiresNamedRole = computed(() => selectedAction.value === 'searchWarrant');

const canAfford = (action: ActionType): boolean => {
  const cost = getActionCost(action);
  return props.myCoins >= cost;
};

// Reset/inicialização ao abrir o modal
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (isMustImpeach.value) {
        selectedAction.value = 'definitiveImpeachment';
        activeCategory.value = 'coups';
      } else {
        selectedAction.value = null;
        activeCategory.value = 'all';
      }
      if (aliveOpponents.value[0]) {
        selectedTargetId.value = aliveOpponents.value[0].id;
      }
    }
  }
);

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

interface ActionOption {
  type: ActionType;
  category: 'basic' | 'roles' | 'coups';
  name: string;
  roleClaim?: string;
  costLabel: string;
  costType: 'positive' | 'negative' | 'neutral';
  description: string;
  defenseInfo: string;
}

const actionOptions: ActionOption[] = [
  {
    type: 'salary',
    category: 'basic',
    name: 'Salário Oficial',
    costLabel: '+C$ 1',
    costType: 'positive',
    description: 'Pegue C$ 1 do cofre.',
    defenseInfo: 'Ação direta irrestrita. Não pode ser contestada nem bloqueada.',
  },
  {
    type: 'crowdfunding',
    category: 'basic',
    name: 'Vaquinha Virtual',
    costLabel: '+C$ 2',
    costType: 'positive',
    description: 'Arrecade C$ 2 do cofre.',
    defenseInfo: 'Bloqueável por qualquer jogador alegando possuir o Barão.',
  },
  {
    type: 'slushFund',
    category: 'roles',
    name: 'Caixa 2',
    roleClaim: 'Barão',
    costLabel: '+C$ 3',
    costType: 'positive',
    description: 'Pegue C$ 3 do cofre central.',
    defenseInfo: 'Desafiável como blefe (Fake News!). Sem bloqueio.',
  },
  {
    type: 'extortion',
    category: 'roles',
    name: 'Extorsão',
    roleClaim: 'Coronel',
    costLabel: 'Até C$ 2',
    costType: 'positive',
    description: 'Exija até C$ 2 de um gabinete rival.',
    defenseInfo: 'Bloqueável pela vítima alegando Coronel ou Marqueteira.',
  },
  {
    type: 'execution',
    category: 'roles',
    name: 'Execução Sumária',
    roleClaim: 'Executor',
    costLabel: '-C$ 3',
    costType: 'negative',
    description: 'Pague C$ 3 para forçar um rival a perder 1 Apoio.',
    defenseInfo: 'Bloqueável pela vítima alegando possuir a Advogada.',
  },
  {
    type: 'exchange',
    category: 'roles',
    name: 'Troca de Cartas',
    roleClaim: 'Marqueteira',
    costLabel: 'Sem custo',
    costType: 'neutral',
    description: 'Compre 2 apoios, escolha quais manter e devolva 2 ao baralho.',
    defenseInfo: 'Pode ser contestada. Não pode ser bloqueada.',
  },
  {
    type: 'searchWarrant',
    category: 'roles',
    name: 'Mandado de Busca',
    roleClaim: 'Investigador',
    costLabel: '-C$ 5',
    costType: 'negative',
    description: 'Pague C$ 5, aponte um rival e nomeie um cargo para apreensão.',
    defenseInfo: 'Pode ser contestado e bloqueado por Advogada ou Coronel. Se aprovado, revela e elimina uma cópia do cargo nomeado.',
  },
  {
    type: 'backroomDeal',
    category: 'roles',
    name: 'Acordo de Bastidor',
    roleClaim: 'Articuladora',
    costLabel: '+C$ 2 / +C$ 1',
    costType: 'positive',
    description: 'Ganhe C$ 2 e conceda C$ 1 para um aliado (ambos do cofre).',
    defenseInfo: 'Articulação diplomática sem bloqueio de defesa.',
  },
  {
    type: 'commonImpeachment',
    category: 'coups',
    name: 'Impeachment Comum',
    costLabel: '-C$ 7',
    costType: 'negative',
    description: 'Pague C$ 7 para cassar 1 Apoio político de um adversário.',
    defenseInfo: 'Bloqueável pelo Intocável mediante pagamento de propina C$ 3.',
  },
  {
    type: 'definitiveImpeachment',
    category: 'coups',
    name: 'Impeachment Definitivo',
    costLabel: '-C$ 10',
    costType: 'negative',
    description: 'Pague C$ 10. Elimina 1 Apoio de um rival sem apelação!',
    defenseInfo: 'Golpe constitucional absoluto: sem bloqueio e sem contestação.',
  },
];

const filteredActions = computed(() => {
  if (isMustImpeach.value) {
    return actionOptions.filter((a) => a.type === 'definitiveImpeachment');
  }
  if (activeCategory.value === 'all') return actionOptions;
  return actionOptions.filter((a) => a.category === activeCategory.value);
});

</script>

<template>
  <AppDialog
    :is-open="isOpen"
    aria-label="Escolher ação do turno"
    max-width-class="max-w-2xl"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <h2 class="font-serif text-lg sm:text-xl font-bold text-gold-light tracking-wide">
            Sua Próxima Jogada
          </h2>
          <p class="text-xs text-ink-muted mt-0.5">
            Disponível: <strong class="text-gold font-bold">C$ {{ myCoins }}</strong>
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          aria-label="Fechar ações"
          class="p-2 rounded-lg text-ink-muted hover:text-gold-light hover:bg-surface-hover border border-transparent hover:border-line transition-all focus-visible:outline-none flex-shrink-0 cursor-pointer"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line pb-3" role="group" aria-label="Filtrar ações">
        <button
          v-for="category in ([['all', 'Todas'], ['basic', 'Básicas'], ['roles', 'Personagens'], ['coups', 'Golpes']] as const)"
          :key="category[0]"
          type="button"
          @click="activeCategory = category[0]"
          :aria-pressed="activeCategory === category[0]"
          class="min-h-10 shrink-0 rounded-lg px-3.5 text-xs font-semibold border transition-all cursor-pointer"
          :class="activeCategory === category[0] ? 'border-line-gold bg-gold/15 text-gold-light font-bold shadow-sm' : 'border-line/60 bg-surface/40 text-ink-muted hover:border-line-gold/40 hover:text-ink'"
        >
          {{ category[1] }}
        </button>
      </div>

      <div class="space-y-3">
        <p v-if="isMustImpeach" class="rounded border border-status-red/40 bg-status-red-bg p-3 text-sm text-status-red">
          Com C$ 10 ou mais, você precisa declarar Impeachment Definitivo.
        </p>
        <article
          v-for="action in filteredActions"
          :key="action.type"
          class="overflow-hidden rounded border transition-colors"
          :class="selectedAction === action.type ? 'border-gold bg-gold/5' : 'border-line bg-paper-deep/50'"
        >
          <button
            type="button"
            :disabled="!canAfford(action.type) || (isMustImpeach && action.type !== 'definitiveImpeachment')"
            :aria-pressed="selectedAction === action.type"
            @click="selectAction(action.type)"
            class="action-option w-full p-3.5 text-left disabled:opacity-40 cursor-pointer"
          >
            <span class="flex items-start justify-between gap-3">
              <span class="min-w-0 font-serif text-base font-semibold text-ink">
                {{ action.name }}
                <span v-if="action.roleClaim" class="mt-0.5 block font-sans text-xs font-normal text-gold-muted">
                  {{ action.roleClaim }}
                </span>
              </span>
              <span
                class="shrink-0 rounded-md px-2 py-1 text-xs font-bold tabular-nums"
                :class="action.costType === 'positive' ? 'bg-status-green-bg text-status-green' : 'bg-surface-elevated text-gold-light'"
              >
                {{ action.costLabel }}
              </span>
            </span>
            <span class="block font-sans text-sm font-normal text-ink-muted">
              {{ action.description }}
            </span>
            <span
              v-if="selectedAction === action.type"
              class="block font-normal border-t border-line pt-2 mt-3 text-sm text-gold-muted"
            >
              {{ action.defenseInfo }}
            </span>
          </button>
          <div v-if="selectedAction === action.type && requiresTarget" class="space-y-4 border-t border-gold/30 p-3.5">
            <fieldset>
              <legend class="mb-2 font-serif text-sm font-bold text-gold-light">
                {{ action.type === 'backroomDeal' ? 'Escolha seu aliado' : 'Escolha o alvo' }}
              </legend>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  v-for="opp in aliveOpponents"
                  :key="opp.id"
                  type="button"
                  @click="selectedTargetId = opp.id"
                  :aria-pressed="selectedTargetId === opp.id"
                  class="flex min-h-11 min-w-0 items-center gap-2 rounded border p-2 text-left cursor-pointer transition-colors"
                  :class="selectedTargetId === opp.id ? 'border-gold bg-gold/15' : 'border-line bg-surface'"
                >
                  <img :src="playerAvatar(opp)" alt="" class="h-8 w-8 shrink-0 rounded object-cover" />
                  <span class="min-w-0">
                    <span class="block break-words text-sm font-semibold">{{ opp.name }}</span>
                    <span class="block text-xs text-gold">C$ {{ opp.coins }}</span>
                  </span>
                </button>
              </div>
            </fieldset>
            <fieldset v-if="requiresNamedRole">
              <legend class="mb-2 font-serif text-sm font-bold text-gold-light">
                Qual personagem será investigado?
              </legend>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  v-for="role in PLAYABLE_ROLES"
                  :key="role"
                  type="button"
                  @click="selectedNamedRole = role"
                  :aria-pressed="selectedNamedRole === role"
                  class="min-h-11 rounded border px-2 text-xs cursor-pointer transition-colors"
                  :class="selectedNamedRole === role ? 'border-gold bg-gold/15 text-gold-light' : 'border-line bg-surface text-ink-muted'"
                >
                  {{ getRoleDisplayName(role) }}
                </button>
              </div>
            </fieldset>
          </div>
        </article>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <button
          type="button"
          @click="emit('close')"
          class="min-h-11 rounded-lg border border-line hover:border-line-gold/50 bg-surface/50 hover:bg-surface-elevated px-5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!selectedAction || (requiresTarget && !selectedTargetId)"
          class="online-primary border border-gold hover:border-gold-light px-6 cursor-pointer"
        >
          Declarar no Plenário
        </button>
      </div>
    </template>
  </AppDialog>
</template>
