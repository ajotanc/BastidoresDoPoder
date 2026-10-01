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

