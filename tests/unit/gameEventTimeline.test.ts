import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import GameEventTimeline from '@/components/online/GameEventTimeline.vue';
import type { GameEvent } from '@/game/models/gameState';

const event = (id: string, message: string): GameEvent => ({ id, timestamp: 1, type: 'ACTION', message, importance: 'normal' });

describe('GameEventTimeline', () => {
  it('rotula cada lance pelo tipo e separa a frase do rótulo', () => {
    const wrapper = mount(GameEventTimeline, { props: { events: [
      event('1', 'Ana declarou Caixa 2 (+C$ 3).'),
      event('2', 'FAKE NEWS! Bruno contestou a alegação de Barão de Ana!'),
      event('3', '💀 ELIMINAÇÃO! Ana perdeu todos os apoios e está fora do jogo!'),
    ] } });
    const items = wrapper.findAll('li').map(li => li.findAll('p').map(p => p.text()));
    expect(items).toEqual([
      ['Jogada', 'Ana declarou Caixa 2 (+C$ 3).'],
      ['Contestação', 'Bruno contestou a alegação de Barão de Ana!'],
      ['Eliminação', 'Ana perdeu todos os apoios e está fora do jogo!'],
    ]);
  });

  it('não interpreta HTML nas mensagens', () => {
    const wrapper = mount(GameEventTimeline, { props: { events: [event('1', 'APOIO PERDIDO! <img src=x onerror=alert(1)> perdeu.')] } });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)> perdeu.');
  });
});
