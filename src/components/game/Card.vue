<script setup lang="ts">
import { computed } from 'vue';
import type { RoleCard, RoleSlug } from '@/types/game';
import { ROLE_CARDS } from '@/constants/gameData';
import { Shield, ShieldPlus, SwordIcon, SwordsIcon } from 'lucide-vue-next';

defineOptions({
  name: 'GameCard'
});

interface Props {
  card?: RoleCard;
  role?: RoleSlug;
  faceDown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  faceDown: false
});

const displayCard = computed<RoleCard | undefined>(() => {
  if (props.card) {
    return props.card;
  }
  if (props.role) {
    return ROLE_CARDS.find((item) => item.slug === props.role);
  }
  return undefined;
});
</script>

<template>
  <article class="relative w-full aspect-[2/3] overflow-hidden select-none text-[#f4ead8] shadow-2xl" :style="{
    '--role-color': displayCard?.roleColor || '#dab65f'
  }" role="group" :aria-label="faceDown
    ? 'Verso da carta — Bastidores do Poder'
    : displayCard
      ? `Carta ${displayCard.name}`
      : 'Carta Bastidores do Poder'
    ">
    <div v-if="faceDown"
      class="game-card relative w-full h-full bg-[#07111d] border-2 border-[#dcb95f] rounded-[18px] p-2">
      <img src="/images/cards/back-card.png" alt="Verso da carta Bastidores do Poder"
        class="w-full h-full object-cover rounded-[13px]" draggable="false" loading="lazy" decoding="async" />

      <div
        class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] pointer-events-none"
        aria-hidden="true" />
    </div>

    <div v-else-if="displayCard"
      class="game-card relative flex flex-col h-full border-2 border-[var(--role-color)] rounded-lg">
      <div class="absolute inset-[2.5cqw] rounded-[2.5cqw] border border-[#334255] pointer-events-none"
        aria-hidden="true" />

      <div class="relative z-10 flex flex-col gap-[2.5cqw] h-full p-[4.5cqw]">
        <header class="relative h-[10%] flex items-center justify-center shrink-0">
          <div v-if="displayCard.iconSrc"
            class="absolute left-2 top-[50%] -translate-y-1/2 w-[10cqw] h-[10cqw] hidden items-center justify-center">
            <img :src="displayCard.iconSrc" :alt="`Ícone ${displayCard.name}`" class="w-full h-full object-contain"
              loading="lazy" decoding="async" />
          </div>
          <div class="flex flex-col gap-[2.0cqw] items-center justify-center text-center leading-none">
            <span class="font-serif text-[6.5cqw] font-black uppercase leading-[.85] text-[#f5ead7]">
              {{ displayCard.name }}
            </span>

            <span class="text-[3.4cqw] font-black uppercase tracking-[.18em]" :style="{ color: displayCard.roleColor }">
              {{ displayCard.category }}
            </span>
          </div>
        </header>

        <section class="relative h-[55%] shrink-0 overflow-hidden border border-[var(--role-color)]">
          <img :src="displayCard.characterSrc ?? '/images/bdp.webp'" :alt="`Personagem ${displayCard.name}`"
            class="w-full h-full object-cover object-top"
            :class="{ 'object-contain p-[15%]': !displayCard.characterSrc }" draggable="false" loading="lazy"
            decoding="async" />

          <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/5"
            aria-hidden="true" />
        </section>

        <div class="flex-1 flex flex-col gap-[2.5cqw] min-h-0">
          <section v-for="(item, index) in [displayCard.cardText.action, displayCard.cardText.defense]" :key="index"
            class="relative flex flex-col align-center justify-center flex-1 min-h-0 border border-[#314456] bg-[#152536] overflow-hidden px-[3%] py-[1.5%]">
            <div class="absolute left-0 top-0 h-full w-[3px]" :style="{ backgroundColor: displayCard.roleColor }" />

            <div class="absolute left-0 top-0 w-full px-[2.0cqw] py-[1.0cqw] flex items-center justify-between">
              <span class="uppercase font-black tracking-[.12em] text-[2.5cqw]"
                :style="{ color: displayCard.roleColor }">
                <template v-if="index === 0 && !item.title.toLowerCase().includes('sem ação')">
                  <div class="flex items-center justify-center gap-[1.5cqw] ml-[1.5cqw]">
                    <span>Ação</span>
                  </div>
                </template>
                <template v-else-if="index === 1 && !item.title.toLowerCase().includes('sem bloqueio')">
                  <div class="flex items-center justify-center gap-[1.5cqw] ml-[1.5cqw]">
                    <span>Bloqueio</span>
                  </div>
                </template>
              </span>

              <span v-if="item.cost" class="shrink-0 text-[2.6cqw] font-black uppercase"
                :style="{ color: displayCard.roleColor }">
                {{ item.cost }}
              </span>
            </div>

            <h3 class="font-serif font-black text-[4.6cqw] leading-tight text-[#f7eedc]">
              {{ item.title }}
            </h3>

            <p class="text-[3.3cqw] leading-[1.2] text-[#f2eadd]">
              {{ item.description }}
            </p>
          </section>
        </div>
      </div>

      <div
        class="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.04]"
        aria-hidden="true" />
    </div>
  </article>
</template>

<style scoped>
.game-card {
  container-type: inline-size;
  background: url('/images/bg-card.png') no-repeat center;
  background-size: cover;
  overflow: hidden;
}

.game-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg,
      transparent 0%,
      rgba(255, 255, 255, 0.018) 35%,
      transparent 55%);
  z-index: 30;
}

.game-card img {
  user-select: none;
  -webkit-user-drag: none;
}

@media print {
  .game-card {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>