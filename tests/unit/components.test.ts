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
});
