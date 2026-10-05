import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPanel from '@/components/ui/AppPanel.vue';
import CoinBadge from '@/components/game/CoinBadge.vue';

describe('Testes de Componentes com @vue/test-utils e jsdom', () => {
  it('AppBadge deve renderizar com a variante correta e slot de texto', () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'gold' },
      slots: { default: 'Apoio' },
    });

    expect(wrapper.text()).toBe('Apoio');
    expect(wrapper.classes()).toContain('border-gold/40');
    expect(wrapper.classes()).toContain('rounded-md');
  });

  it('AppBadge deve aplicar variante "red" corretamente', () => {
    const wrapper = mount(AppBadge, {
      props: { variant: 'red' },
      slots: { default: 'Ataque' },
    });

    expect(wrapper.text()).toBe('Ataque');
    expect(wrapper.classes()).toContain('text-status-red');
  });

  it('AppPanel deve renderizar o título e o conteúdo do slot', () => {
    const wrapper = mount(AppPanel, {
      props: { title: 'Regra de Ouro' },
      slots: { default: '<p class="content">Conteúdo explicativo</p>' },
    });

    expect(wrapper.find('h3').text()).toBe('Regra de Ouro');
    expect(wrapper.find('p.content').text()).toBe('Conteúdo explicativo');
  });

  it('CoinBadge deve renderizar moeda de Ouro (C$ 10) com tag formatada e sem rounded-full', () => {
    const wrapper = mount(CoinBadge, {
      props: {
        slug: 'gold',
        size: 'sm',
      },
    });

    expect(wrapper.text()).toContain('C$ 10');
    expect(wrapper.classes()).toContain('rounded-md');
    expect(wrapper.classes()).not.toContain('rounded-full');
    expect(wrapper.find('img').attributes('src')).toBe('/images/coins/gold.webp');
  });

  it('CoinBadge deve renderizar como span quando clickable for falso', () => {
    const wrapper = mount(CoinBadge, {
      props: {
        slug: 'bronze',
        clickable: false,
      },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('span');
    expect(wrapper.classes()).toContain('cursor-default');
  });

  it('Spinner deve renderizar com atributos de acessibilidade e classes padrão', async () => {
    const { Spinner } = await import('@/components/ui/spinner');
    const wrapper = mount(Spinner);

    expect(wrapper.element.tagName.toLowerCase()).toBe('svg');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.classes()).toContain('animate-spin');
    expect(wrapper.classes()).toContain('text-gold');
    expect(wrapper.classes()).toContain('h-5');
  });

  it('Spinner deve aplicar tamanho, variante e classes customizadas', async () => {
    const { Spinner } = await import('@/components/ui/spinner');
    const wrapper = mount(Spinner, {
      props: {
        size: 'sm',
        variant: 'ink',
        class: 'custom-spinner-class',
      },
    });

    expect(wrapper.classes()).toContain('h-4');
    expect(wrapper.classes()).toContain('w-4');
    expect(wrapper.classes()).toContain('text-ink');
    expect(wrapper.classes()).toContain('custom-spinner-class');
  });

  it('Spinner deve renderizar acessibilidade com label e role status', async () => {
    const { Spinner } = await import('@/components/ui/spinner');
    const wrapper = mount(Spinner, {
      props: {
        label: 'Carregando dados',
      },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('span');
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Carregando dados');
    expect(wrapper.find('span.sr-only').text()).toBe('Carregando dados');
  });

  it('AppSpinner deve funcionar como wrapper transparente', async () => {
    const { default: AppSpinner } = await import('@/components/ui/AppSpinner.vue');
    const wrapper = mount(AppSpinner, {
      props: {
        size: 'lg',
        variant: 'white',
      },
    });

    expect(wrapper.classes()).toContain('h-8');
    expect(wrapper.classes()).toContain('text-white');
  });

  it('Sonner deve renderizar container Toaster e expor métodos toast', async () => {
    const { Sonner, toast } = await import('@/components/ui/sonner');
    expect(typeof toast.success).toBe('function');
    expect(typeof toast.error).toBe('function');

    const wrapper = mount(Sonner);
    expect(wrapper.exists()).toBe(true);
  });

  it('Toggle deve alternar estado ativo/inativo e emitir update:pressed', async () => {
    const { Toggle } = await import('@/components/ui/toggle');
    const wrapper = mount(Toggle, {
      props: {
        pressed: false,
        variant: 'outline',
        size: 'icon',
      },
      slots: {
        default: 'Som',
      },
    });

    expect(wrapper.attributes('aria-pressed')).toBe('false');
    expect(wrapper.attributes('data-state')).toBe('off');

    await wrapper.trigger('click');
    expect(wrapper.emitted('update:pressed')).toBeTruthy();
    expect(wrapper.emitted('update:pressed')?.[0]).toEqual([true]);

    await wrapper.setProps({ pressed: true });
    expect(wrapper.attributes('aria-pressed')).toBe('true');
    expect(wrapper.attributes('data-state')).toBe('on');
  });

  it('Button deve renderizar tag button e variante especificada', async () => {
    const { Button } = await import('@/components/ui/button');
    const wrapper = mount(Button, {
      props: { variant: 'gold', size: 'sm' },
      slots: { default: 'Ação Principal' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('button');
    expect(wrapper.text()).toBe('Ação Principal');
    expect(wrapper.classes()).toContain('bg-gold');
  });

  it('GameResultSummary deve renderizar versão short e versão story 16:9', async () => {
    const { default: GameResultSummary } = await import('@/components/game/GameResultSummary.vue');
    const { createInitialAuthoritativeState } = await import('@/game/engine/gameEngine');

    const state = {
      ...createInitialAuthoritativeState('TEST', 'p1', 'Deputado Alerson', 'baron', 'token-1').publicState,
      phase: 'FINISHED' as const,
      winnerPlayerId: 'p1',
      history: [
        { id: '1', type: 'GAME_FINISHED', message: 'Deputado Alerson venceu.', timestamp: 1, importance: 'normal' as const },
        { id: '2', type: 'ACTION_DECLARED', message: 'Deputado Alerson declarou Golpe Final.', timestamp: 1, importance: 'normal' as const },
        { id: '3', type: 'TURN_CHANGED', message: 'Turno 8', timestamp: 1, importance: 'normal' as const },
      ],
    };

    // Testa variant="short"
    const wrapperShort = mount(GameResultSummary, {
      props: { gameState: state, variant: 'short' },
    });
    expect(wrapperShort.find('.result-summary-short').exists()).toBe(true);
    expect(wrapperShort.text()).toContain('Resultado da mesa');
    expect(wrapperShort.text()).toContain('Deputado Alerson');
    expect(wrapperShort.text()).toContain('Vencedor da mesa');

    // Testa variant="story" (Instagram Stories 16:9 vertical)
    const wrapperStory = mount(GameResultSummary, {
      props: { gameState: state, variant: 'story' },
    });
    expect(wrapperStory.find('.result-summary-story').exists()).toBe(true);
    expect(wrapperStory.text().toUpperCase()).toContain('BASTIDORES');
    expect(wrapperStory.text().toUpperCase()).toContain('DO PODER');
    expect(wrapperStory.text()).toContain('Deputado Alerson');
    expect(wrapperStory.text()).toContain('Nova partida');
    expect(wrapperStory.text()).toContain('Quem joga a próxima?');
    expect(wrapperStory.text()).toContain('Chame os amigos para uma nova partida');
  });
});

describe('RoleCardsSection - Filtro de Personagens e Ajuda', () => {
  it('deve renderizar inicialmente apenas os 8 personagens jogáveis, ocultando o Guia de Mesa', async () => {
    const { default: RoleCardsSection } = await import('@/components/game/RoleCardsSection.vue');
    const wrapper = mount(RoleCardsSection);

    // Encontra todos os RoleCardItem
    const cardItems = wrapper.findAllComponents({ name: 'RoleCardItem' });
    expect(cardItems).toHaveLength(8);

    // Garante que o Guia não está entre os cartões renderizados
    const cardTexts = cardItems.map((item) => item.text());
    expect(cardTexts.some((text) => text.includes('Guia de Mesa'))).toBe(false);
    expect(cardTexts.some((text) => text.includes('Coronel'))).toBe(true);
    expect(cardTexts.some((text) => text.includes('Intocável'))).toBe(true);
  });

  it('deve exibir apenas o Guia de Mesa ao clicar no filtro "Ajuda"', async () => {
    const { default: RoleCardsSection } = await import('@/components/game/RoleCardsSection.vue');
    const wrapper = mount(RoleCardsSection);

    const select = wrapper.findComponent({ name: 'AppSelect' });
    select.vm.$emit('update:modelValue', 'help');
    await wrapper.vm.$nextTick();
    const cardItems = wrapper.findAllComponents({ name: 'RoleCardItem' });
    expect(cardItems).toHaveLength(1);
    expect(wrapper.text()).toContain('Guia de Mesa');
    expect(wrapper.text()).not.toContain('Coronel');
  });
});

describe('Tag Component', () => {
  it('deve renderizar texto e classes corretas para variante e tamanho', async () => {
    const { Tag } = await import('@/components/ui/tag');
    const wrapper = mount(Tag, {
      props: { variant: 'primary', size: 'sm' },
      slots: { default: 'Mesa BDP1' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('span');
    expect(wrapper.text()).toBe('Mesa BDP1');
    expect(wrapper.classes()).toContain('bg-surface-elevated');
    expect(wrapper.classes()).toContain('text-[11px]');

    const wrapperXs = mount(Tag, {
      props: { variant: 'primary', size: 'xs' },
      slots: { default: 'XS' },
    });
    expect(wrapperXs.classes()).toContain('text-[10px]');
  });

  it('deve suportar variante gold com cores idênticas ao Button', async () => {
    const { Tag } = await import('@/components/ui/tag');
    const wrapper = mount(Tag, {
      props: { variant: 'gold', size: 'md' },
      slots: { default: 'Vencedor' },
    });

    expect(wrapper.classes()).toContain('bg-gold');
    expect(wrapper.classes()).toContain('text-surface-elevated');
    expect(wrapper.classes()).toContain('text-xs');
  });
});

describe('Alert Component (shadcn-vue)', () => {
  it('deve renderizar Alert, AlertTitle e AlertDescription com variante warning', async () => {
    const { Alert, AlertTitle, AlertDescription } = await import('@/components/ui/alert');
    const wrapper = mount(Alert, {
      props: { variant: 'warning' },
      slots: {
        default: [
          '<h5 class="title">Conexão interrompida</h5>',
          '<div class="desc">Aguarde o anfitrião</div>',
        ],
      },
    });

    const titleWrapper = mount(AlertTitle, { slots: { default: 'Atenção' } });
    const descWrapper = mount(AlertDescription, { slots: { default: 'Descrição do alerta' } });

    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.classes()).toContain('border-gold/40');
    expect(wrapper.classes()).toContain('bg-surface-elevated');
    expect(wrapper.text()).toContain('Conexão interrompida');
    expect(titleWrapper.classes()).toContain('font-serif');
    expect(descWrapper.classes()).toContain('leading-relaxed');
  });

  it('deve renderizar Alert com flex items-center e respeitar prop size sm e lg', async () => {
    const { Alert } = await import('@/components/ui/alert');
    const wrapperSm = mount(Alert, {
      props: { size: 'sm', variant: 'success' },
      slots: { default: 'Sucesso rápido' },
    });
    expect(wrapperSm.classes()).toContain('flex');
    expect(wrapperSm.classes()).toContain('items-center');
    expect(wrapperSm.classes()).toContain('text-xs');
    expect(wrapperSm.classes()).toContain('bg-status-green-bg/80');

    const wrapperLg = mount(Alert, {
      props: { size: 'lg', variant: 'gold' },
      slots: { default: 'Alerta destacado' },
    });
    expect(wrapperLg.classes()).toContain('text-base');
    expect(wrapperLg.classes()).toContain('bg-[#29261e]');
  });

  it('deve renderizar variante destructive para mensagens de erro', async () => {
    const { Alert } = await import('@/components/ui/alert');
    const wrapper = mount(Alert, {
      props: { variant: 'destructive' },
      slots: { default: 'Erro ao conectar' },
    });

    expect(wrapper.classes()).toContain('bg-status-red-bg');
    expect(wrapper.classes()).toContain('text-status-red');
  });
});


