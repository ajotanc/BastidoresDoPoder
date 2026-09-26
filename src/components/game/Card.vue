<script setup lang="ts">
import { computed } from 'vue';
import type { RoleCard, RoleSlug } from '@/types/game';
import { ROLE_CARDS } from '@/constants/gameData';
import { ShieldPlus, SwordsIcon } from 'lucide-vue-next';

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
  <div
    class="game-card flex w-full aspect-[2/3] overflow-hidden select-none text-[#f4ead8] shadow-2xl border-2 border-[var(--role-color)] rounded-[0.75cqw] p-[0.5cqw]"
    :style="{
      '--role-color': displayCard?.roleColor || '#dab65f'
    }" role="group" :aria-label="faceDown
    ? 'Verso da carta — Bastidores do Poder'
    : displayCard
      ? `Carta ${displayCard.name}`
      : 'Carta Bastidores do Poder'
    ">
    <div v-if="faceDown" class="flex flex-1 overflow-hidden">
      <img src="/images/cards/back-card.png" alt="Verso da carta Bastidores do Poder" class="w-full h-full object-cover"
        draggable="false" loading="lazy" decoding="async" />

      <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/5"
        aria-hidden="true" />
    </div>

    <div v-else-if="displayCard" class="flex-1 rounded-[1.75cqw] border border-[#334255] pointer-events-none"
      aria-hidden="true">
      <div class="p-[3cqw] flex flex-1 flex-col gap-[3cqw] h-full">
        <header class="flex items-center justify-between gap-[3cqw] shrink-0">
          <div v-if="displayCard.iconSrc"
            class="h-[16cqw] w-[16cqw] flex items-center justify-center border border-[#334255] p-[1cqw] rounded-[1.75cqw]">
            <img :src="displayCard.iconSrc" :alt="`Ícone ${displayCard.name}`" class="w-full h-full object-contain"
              loading="lazy" decoding="async" />
          </div>
          <div class="flex flex-1 flex-col gap-[1cqw] items-start justify-center text-center leading-none">
            <span class="font-serif text-[7cqw] font-black uppercase leading-[.85] text-[#f5ead7]">
              {{ displayCard.name }}
            </span>

            <span class="text-[4cqw] font-black uppercase leading-none tracking-[.12em]"
              :style="{ color: displayCard.roleColor }">
              {{ displayCard.category }}
            </span>
          </div>
        </header>

        <section class="aspect-[4/3] shrink-0 overflow-hidden border border-[var(--role-color)] rounded-[1.75cqw]">
          <img :src="displayCard.characterSrc ?? '/images/bdp.webp'" :alt="`Personagem ${displayCard.name}`"
            class="w-full h-full object-cover object-top"
            :class="{ 'object-contain p-[15%]': !displayCard.characterSrc }" draggable="false" loading="lazy"
            decoding="async" />

          <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/5"
            aria-hidden="true" />
        </section>

        <div class="flex-1 flex flex-col gap-[1.5cqw] min-h-0">
          <section v-for="(item, index) in [displayCard.cardText.action, displayCard.cardText.defense]" :key="index"
            class="relative flex flex-col gap-[1.5cqw] px-[3.5cqw] py-[2.0cqw]  justify-center text-left flex-1 min-h-0 border border-[#314456] bg-[#152536] overflow-hidden rounded-[1.75cqw]">
            <div class="absolute left-0 top-0 h-full w-[1cqw]" :style="{ backgroundColor: displayCard.roleColor }" />

            <div class="w-full flex items-center justify-between">
              <div class="uppercase font-black tracking-[.12em] text-[3.0cqw]"
                :style="{ color: displayCard.roleColor }">
                <template v-if="index === 0">
                  <div class="flex items-center justify-center gap-[1.5cqw]">
                    <SwordsIcon class="w-[3cqw] h-[3cqw] shrink-0" aria-hidden="true" />
                    <span class="leading-none">Ação</span>
                  </div>
                </template>
                <template v-else-if="index === 1">
                  <div class="flex items-center justify-center gap-[1.5cqw]">
                    <ShieldPlus class="w-[3cqw] h-[3cqw] shrink-0" aria-hidden="true" />
                    <span class="leading-none">Bloqueio</span>
                  </div>
                </template>
              </div>

              <span class="uppercase font-black tracking-[.12em] text-[3.0cqw]"
                :style="{ color: displayCard.roleColor }">
                {{ item.cost || '-' }}
              </span>
            </div>

            <div class="flex justify-center flex-col flex-1 min-h-0">
              <h3 class="font-serif font-black text-[5cqw] leading-tight text-[#f7eedc]">
                {{ item.title }}
              </h3>

              <p class="text-[3.5cqw] leading-[1.2] text-[#f2eadd]">
                {{ item.description }}
              </p>
            </div>
          </section>
        </div>
        <div
          class="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.04]"
          aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  container-type: inline-size;
  background: url('/images/bg-card.png') no-repeat center;
  background-size: cover;
  overflow: hidden;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
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
</style>