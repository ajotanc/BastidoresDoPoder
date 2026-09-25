<script setup lang="ts">
import { useCoinLightbox } from '@/composables/useCoinLightbox';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { X, Download, Coins, Sparkles, Scale } from 'lucide-vue-next';

const { isOpen, activeCoin, closeCoinLightbox } = useCoinLightbox();
</script>

<template>
  <AppDialog
    :is-open="isOpen && !!activeCoin"
    :aria-label="activeCoin ? `Moeda ${activeCoin.name}` : 'Visualizador de Moeda'"
    max-width-class="max-w-lg"
    @close="closeCoinLightbox"
  >
    <!-- Cabeçalho Fixo do Modal -->
    <template #header>
      <div v-if="activeCoin" class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Ícone / Emblema da Moeda -->
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center bg-[#091017] border border-gold-dark/70 shadow-inner flex-shrink-0 p-1"
            :style="{ borderColor: activeCoin.color }"
          >
            <img
              :src="activeCoin.imageSrc"
              :alt="activeCoin.imageAlt"
              class="w-full h-full object-contain drop-shadow"
            />
          </div>

          <!-- Informações e Tag Oficial -->
          <div class="min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2 class="font-serif font-bold text-xl sm:text-2xl text-[#f7f0e2] tracking-tight leading-none whitespace-nowrap">
                {{ activeCoin.name }}
              </h2>

              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-serif font-bold tracking-wider border shadow-sm select-none whitespace-nowrap"
                :style="{
                  backgroundColor: activeCoin.color + '20',
                  borderColor: activeCoin.color + '70',
                  color: activeCoin.color
                }"
              >
                <Sparkles class="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span>{{ activeCoin.label }}</span>
              </span>
            </div>

            <div class="flex items-center gap-2 mt-1.5 text-xs text-ink-muted whitespace-nowrap">
              <span>Metal: {{ activeCoin.material }}</span>
              <span class="w-1 h-1 rounded-sm bg-gold-dark/60" aria-hidden="true"></span>
              <span class="text-gold-light/90">Moeda Oficial de Brasília</span>
            </div>
          </div>
        </div>

        <!-- Botão Fechar -->
        <button
          type="button"
          @click="closeCoinLightbox"
          class="p-2 rounded-lg text-ink-muted hover:text-gold-light hover:bg-surface-hover border border-transparent hover:border-line transition-all focus-visible:outline-none flex-shrink-0"
          aria-label="Fechar visualização da moeda"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </template>

    <!-- Conteúdo com Scroll Exclusivo -->
    <div v-if="activeCoin" class="flex flex-col items-center justify-center py-4 px-2 space-y-6">
      <!-- Apresentação Visual da Moeda com Brilho e Efeito Físico -->
      <div class="relative group/coin cursor-default select-none py-2">
        <!-- Glow de Fundo de acordo com a cor do metal -->
        <div
          class="absolute inset-0 rounded-2xl blur-2xl opacity-40 group-hover/coin:opacity-60 transition-opacity pointer-events-none"
          :style="{ backgroundColor: activeCoin.color }"
        ></div>

        <div
          class="relative w-48 h-48 sm:w-56 sm:h-56 p-2 transition-transform duration-500 group-hover/coin:scale-105 flex items-center justify-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
        >
          <img
            :src="activeCoin.imageSrc"
            :alt="activeCoin.imageAlt"
            class="w-full h-full object-contain pointer-events-none select-none filter contrast-105 brightness-105"
          />
        </div>
      </div>

      <!-- Resumo e Descrição Econômica -->
      <div class="w-full space-y-4 text-left">
        <div class="p-4 rounded-lg bg-surface-elevated/80 border border-line space-y-2">
          <div class="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gold-light">
            <Coins class="w-4 h-4 text-gold" aria-hidden="true" />
            <span>Papel na Economia do Jogo</span>
          </div>
          <p class="text-sm text-ink-muted leading-relaxed mb-0">
            {{ activeCoin.description }}
          </p>
        </div>

        <div class="p-4 rounded-lg bg-surface-elevated/80 border border-line space-y-2">
          <div class="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-gold-light">
            <Scale class="w-4 h-4 text-gold" aria-hidden="true" />
            <span>Principais Aplicações e Regras</span>
          </div>
          <p class="text-sm text-ink-muted leading-relaxed mb-0">
            {{ activeCoin.usage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Rodapé Fixo com Botão de Download -->
    <template #footer>
      <div v-if="activeCoin" class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <span>Conto oficial para confecção e partidas de mesa</span>
        <AppButton
          variant="gold"
          size="sm"
          :href="activeCoin.imageSrc"
          :download="`bastidores-do-poder-${activeCoin.slug}.webp`"
        >
          <Download class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Baixar arte da moeda</span>
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>
