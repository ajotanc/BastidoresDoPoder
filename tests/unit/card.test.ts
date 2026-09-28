import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@/components/game/Card.vue';
import { ROLE_CARDS } from '@/constants/gameData';

describe('Card — layout compartilhado', () => {
  it('reflete alterações de regras nos dados sem depender de arte pronta', async () => {
    const card = ROLE_CARDS[0]!;
    const wrapper = mount(Card, { props: { card } });
    expect(wrapper.find(`img[src="${card.characterSrc}"]`).exists()).toBe(true);
    const revised = { ...card, name: 'Nome atualizado', cardText: { ...card.cardText, action: { ...card.cardText.action, description: 'Texto corrigido' } } };
    await wrapper.setProps({ card: revised });
    expect(wrapper.text()).toContain('Nome atualizado');
    expect(wrapper.text()).toContain('Texto corrigido');
    expect(wrapper.html()).not.toContain('/images/cards/');
  });
  it('verso não inclui nome, arte ou habilidades secretas nem no DOM', () => {
    const wrapper = mount(Card, { props: { role: 'executor', faceDown: true } });
    expect(wrapper.text()).not.toContain('Executor');
    expect(wrapper.find('header').exists()).toBe(false);
    expect(wrapper.html()).not.toContain('/characters/executor');
  });
  it('guia usa o brasão quando não existe retrato', () => {
    const guide = mount(Card, { props: { role: 'guide' } });
    expect(guide.text()).toContain('Guia de Mesa');
    expect(guide.find('img[alt="Personagem Guia de Mesa"]').attributes('src')).toBe('/images/bdp.webp');
  });
});
