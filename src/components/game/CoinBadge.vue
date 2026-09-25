<script setup lang="ts">
import { computed } from 'vue';
import { GAME_COINS } from '@/constants/gameData';
import { useCoinLightbox } from '@/composables/useCoinLightbox';
import type { CoinSlug, GameCoin } from '@/types/game';

interface Props {
  slug?: CoinSlug;
  value?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  slug: undefined,
  value: undefined,
  showLabel: true,
  size: 'md',
  clickable: true,
});

const { openCoinLightbox } = useCoinLightbox();

const coin = computed<GameCoin | undefined>(() => {
  if (props.slug) {
    return GAME_COINS.find((c) => c.slug === props.slug);
  }
  if (props.value !== undefined) {
    return GAME_COINS.find((c) => c.value === props.value);
  }
  return undefined;
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        wrapper: 'h-6 text-xs gap-1.5 px-2 py-0.5 rounded-md',
        img: 'w-3.5 h-3.5',
      };
    case 'lg':
      return {
        wrapper: 'h-9 text-sm gap-2.5 px-3 py-1 rounded-md',
        img: 'w-6 h-6',
      };
    case 'md':
    default:
      return {
        wrapper: 'h-7 text-xs gap-2 px-2.5 py-1 rounded-md',
        img: 'w-4 h-4',
      };
  }
});

const handleClick = (): void => {
  if (props.clickable && coin.value) {
    openCoinLightbox(coin.value);
  }
};
</script>

<template>
  <component
    :is="props.clickable ? 'button' : 'span'"
    v-if="coin"
    :type="props.clickable ? 'button' : undefined"
    @click="handleClick"
    :class="[
      'inline-flex items-center font-serif font-bold tracking-wide border transition-all duration-200 select-none group/badge',
      props.clickable ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-default',
      sizeClasses.wrapper
    ]"
    :style="{
      backgroundColor: coin.color + '15',
      borderColor: coin.color + '55',
      color: coin.color
    }"
    :title="props.clickable ? `Clique para ver o ${coin.name} em alta resolução` : coin.name"
    :aria-label="props.clickable ? `Ver ${coin.name} ampliado` : coin.name"
  >
    <img
      :src="coin.imageSrc"
      :alt="coin.name"
      :class="[sizeClasses.img, 'object-contain flex-shrink-0 drop-shadow', props.clickable ? 'group-hover/badge:scale-110 transition-transform' : '']"
    />
    <span v-if="props.showLabel" :class="props.clickable ? 'group-hover/badge:underline decoration-gold/60 underline-offset-2' : ''">
      {{ coin.label }}
    </span>
  </component>
</template>
