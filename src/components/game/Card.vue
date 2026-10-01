<script setup lang="ts">
import { GAME_NAME } from "@/constants/gameConfig";
import { computed } from 'vue';
import type { RoleCard, RoleSlug } from '@/types/game';
import { ROLE_CARDS } from '@/constants/gameData';
import { ShieldPlus, SwordsIcon } from '@lucide/vue';

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
  <div class="game-card-shell relative aspect-[2/3] w-full">
  <Transition name="card-flip" mode="out-in">
  <div
    :key="faceDown ? 'back' : 'front'"
    class="game-card relative isolate aspect-[2/3] w-full overflow-hidden select-none text-[#f4ead8]"
    :style="{ '--role-color': displayCard?.roleColor || '#dab65f' }"
    role="group"
    :aria-label="faceDown ? `Verso da carta — ${GAME_NAME}` : displayCard ? `Carta ${displayCard.name}` : `Carta ${GAME_NAME}`"
  >
    <div v-if="faceDown" class="card-back-surface absolute inset-0 overflow-hidden rounded-[inherit]">
      <img src="/images/cards/back-card.webp" :alt="`Verso da carta ${GAME_NAME}`"
        class="h-full w-full" draggable="false" loading="lazy" decoding="async" />
    </div>

    <div v-else-if="displayCard"
      class="card-content-surface absolute inset-0 grid grid-rows-[15fr_45fr_40fr] gap-[2.5cqw] p-[4cqw]"
      aria-hidden="true">
      <header class="flex min-h-0 min-w-0 items-center gap-[3cqw]">
        <div v-if="displayCard.iconSrc"
          class="card-emblem flex size-[14cqw] shrink-0 items-center justify-center rounded-[2cqw] p-[1.5cqw]">
          <img :src="displayCard.iconSrc" alt="" class="h-full w-full object-contain" loading="lazy" decoding="async" />
        </div>
        <div class="flex min-w-0 flex-col gap-[1.8cqw] text-left">
          <span class="card-name font-serif text-[6cqw] font-black uppercase leading-[1.25] tracking-[-0.035em] text-[#f5ead7]">
            {{ displayCard.name }}
          </span>
          <span class="text-[3cqw] font-bold uppercase leading-[1.3] tracking-[0.16em] text-[var(--role-color)]">
            {{ displayCard.category }}
          </span>
        </div>
      </header>

      <section class="card-portrait relative min-h-0 overflow-hidden rounded-[2cqw]">
        <img :src="displayCard.characterSrc ?? '/images/bdp.webp'" alt=""
          class="h-full w-full object-cover object-top"
          :class="{ 'object-contain p-[15%]': !displayCard.characterSrc }"
          draggable="false" loading="lazy" decoding="async" />
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1521]/35 to-transparent" />
      </section>

      <div class="grid min-h-0 grid-rows-2 gap-[2cqw]">
        <section v-for="(item, index) in [displayCard.cardText.action, displayCard.cardText.defense]" :key="index"
          class="card-ability flex min-h-0 flex-col justify-center gap-[1.5cqw] rounded-[2cqw] px-[3cqw] py-[2cqw] text-left">
          <div class="flex items-center justify-between gap-[2cqw] text-[2.9cqw] font-bold uppercase leading-none tracking-[0.1em] text-[var(--role-color)]">
            <span class="flex items-center gap-[1.5cqw]">
              <component :is="index === 0 ? SwordsIcon : ShieldPlus" class="size-[3.5cqw] shrink-0" />
              {{ index === 0 ? 'Ação' : 'Bloqueio' }}
            </span>
            <span v-if="item.cost" class="card-cost rounded-[1cqw] px-[1.5cqw] py-[0.8cqw] tabular-nums">{{ item.cost }}</span>
          </div>
          <div class="space-y-[0.8cqw]">
            <h3 class="min-h-[5.72cqw] whitespace-nowrap font-serif text-[4.4cqw] font-bold leading-[1.3] text-[#f7eedc]">{{ item.title }}</h3>
            <p class="min-h-[9.1cqw] text-[3.5cqw] font-normal leading-[1.3] text-[#cbd4de]">{{ item.description }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
  </Transition>
  </div>
</template>

<style scoped>
.game-card-shell { perspective: 1000px; }
.card-flip-leave-active { transition: transform .45s cubic-bezier(.55, 0, 1, .45); }
.card-flip-enter-active { transition: transform .45s cubic-bezier(0, .55, .45, 1); }
.card-flip-enter-from { transform: rotateY(-90deg); }
.card-flip-leave-to { transform: rotateY(90deg); }
@media (prefers-reduced-motion: reduce) {
  .card-flip-enter-active, .card-flip-leave-active { transition: none; }
}
.game-card {
  container-type: inline-size;
  border-radius: var(--ui-radius, 10px);
  background: #0d1824 url('/images/bg-card.png') center / cover no-repeat;
  box-shadow: 0 6px 16px #0004;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.card-content-surface {
  border-radius: inherit;
  background: radial-gradient(ellipse at 0 0, color-mix(in srgb, var(--role-color) 12%, transparent), transparent 60%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--role-color) 65%, #334255), inset 0 1px 0 #ffffff30;
}
.card-back-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #dab65f 65%, #334255), inset 0 1px 0 #ffffff30;
}
.card-name {
  text-shadow: 0 1px 2px #0009;
}
.card-emblem {
  background: linear-gradient(135deg, #e6bf7338, #111c29 65%, #e6bf7315);
  box-shadow: inset 0 0 0 1px #e6bf7350, inset 0 1px 0 #ffe5aa45, 0 1cqw 2cqw #0004;
}
.card-portrait {
  box-shadow: 0 0 0 1px #ffffff12;
}
.card-ability {
  background: linear-gradient(110deg, color-mix(in srgb, var(--role-color) 9%, #142331), #142331ed);
}
.card-cost {
  background: color-mix(in srgb, var(--role-color) 13%, #0d1824);
  color: color-mix(in srgb, var(--role-color) 65%, #fff);
}
.game-card img {
  user-select: none;
  -webkit-user-drag: none;
}
</style>
