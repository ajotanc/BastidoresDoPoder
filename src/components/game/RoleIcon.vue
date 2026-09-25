<script setup lang="ts">
import type { RoleSlug } from '@/types/game';

interface Props {
  role: string | RoleSlug;
  color?: string;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'currentColor',
  size: 28,
});
</script>

<template>
  <svg :width="props.size" :height="props.size" viewBox="0 0 24 24" fill="none" :stroke="props.color" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="flex-shrink-0">
    <!-- Coronel / Colonel: Moedas -->
    <template v-if="props.role.toLowerCase().includes('coronel') || props.role.toLowerCase().includes('colonel')">
      <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" />
      <path d="M15 6h1v4" />
      <path d="m6.134 14.768.866-.5 2 3.464" />
      <circle cx="16" cy="8" r="6" />
    </template>

    <!-- Executor: Mira / Alvo -->
    <template v-else-if="props.role.toLowerCase().includes('executor')">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </template>

    <!-- Intocável / Untouchable: Escudo -->
    <template v-else-if="props.role.toLowerCase().includes('intoc') || props.role.toLowerCase().includes('untouch')">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </template>

    <!-- Advogada / Lawyer: Balança -->
    <template v-else-if="props.role.toLowerCase().includes('advogado') || props.role.toLowerCase().includes('lawyer')">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </template>

    <!-- Barão / Baron: Coroa -->
    <template v-else-if="props.role.toLowerCase().includes('bar')">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </template>

    <!-- Marqueteira / Marketer: Megafone -->
    <template
      v-else-if="props.role.toLowerCase().includes('marqueteiro') || props.role.toLowerCase().includes('market')">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </template>

    <!-- Investigador / Investigator: Lupa -->
    <template v-else-if="props.role.toLowerCase().includes('investiga')">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </template>

    <!-- Guia de Mesa / Ajuda: Livro -->
    <template v-else>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </template>
  </svg>
</template>
