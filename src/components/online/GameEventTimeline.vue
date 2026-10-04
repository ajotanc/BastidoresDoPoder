<script setup lang="ts">
import { computed, type Component } from 'vue';
import { BadgeCheck, Eye, Flame, Gavel, HeartCrack, ShieldCheck, Skull, Trophy } from '@lucide/vue';
import type { GameEvent } from '@/game/models/gameState';

type Tone = 'red' | 'gold' | 'green' | 'neutral';

const props = defineProps<{ events: readonly GameEvent[] }>();

const KINDS: readonly { lead: RegExp; label: string; icon: Component; tone: Tone }[] = [
  { lead: /^FAKE NEWS!/i, label: 'Contestação', icon: Flame, tone: 'red' },
  { lead: /^Blefe desmascarado!/i, label: 'Blefe desmascarado', icon: Eye, tone: 'red' },
  { lead: /^Comprovado!/i, label: 'Alegação comprovada', icon: BadgeCheck, tone: 'green' },
  { lead: /^BLOQUEIO!/i, label: 'Bloqueio', icon: ShieldCheck, tone: 'gold' },
  { lead: /^APOIO PERDIDO!/i, label: 'Apoio perdido', icon: HeartCrack, tone: 'red' },
  { lead: /^ELIMINAÇÃO!/i, label: 'Eliminação', icon: Skull, tone: 'red' },
  { lead: /^VITÓRIA POLÍTICA!/i, label: 'Vitória política', icon: Trophy, tone: 'gold' },
];

const TONES: Record<Tone, { node: string; label: string }> = {
  red: { node: 'border-status-red/50 bg-status-red-bg text-status-red', label: 'text-status-red' },
  gold: { node: 'border-gold/40 bg-gold/10 text-gold', label: 'text-gold-light' },
  green: { node: 'border-status-green/50 bg-status-green-bg/80 text-status-green', label: 'text-status-green' },
  neutral: { node: 'border-line bg-paper-deep text-ink-muted', label: 'text-ink-muted' },
};

const steps = computed(() => props.events.map(event => {
  const text = event.message.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replaceAll('**', '').trim();
  const kind = KINDS.find(item => item.lead.test(text));
  return {
    id: event.id,
    label: kind?.label ?? 'Jogada',
    icon: kind?.icon ?? Gavel,
    tone: TONES[kind?.tone ?? 'neutral'],
    text: kind ? text.replace(kind.lead, '').trim() : text,
  };
}));
</script>

<template>
  <ol class="m-0 list-none p-0">
    <li v-for="(step, index) in steps" :key="step.id" class="relative flex gap-3.5 pb-6 last:pb-0">
      <span v-if="index < steps.length - 1"
        class="absolute bottom-1 left-[18px] top-[42px] w-px -translate-x-1/2 bg-line" aria-hidden="true"></span>
      <span class="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border" :class="step.tone.node">
        <component :is="step.icon" class="size-4" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold leading-4" :class="step.tone.label">{{ step.label }}</p>
        <p class="break-words text-sm leading-5 text-ink">{{ step.text }}</p>
      </div>
    </li>
  </ol>
</template>
