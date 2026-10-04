import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppInput from '@/components/ui/AppInput.vue';

describe('AppInput', () => {
  it('mostra o valor, repassa atributos e emite texto', async () => {
    const wrapper = mount(AppInput, { props: { modelValue: 'Ana' }, attrs: { id: 'nome', placeholder: 'Nome' } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('Ana');
    expect(input.attributes('id')).toBe('nome');
    await input.setValue('Bruno');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Bruno']);
  });

  it('converte para número com o modificador .number', async () => {
    const wrapper = mount(AppInput, { props: { modelValue: 2, modelModifiers: { number: true }, type: 'number' } });
    await wrapper.find('input').setValue('5');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5]);
  });

  it('mescla classes e mantém o campo vazio quando o valor é nulo', () => {
    const wrapper = mount(AppInput, { props: { modelValue: null, class: 'pl-9' } });
    expect(wrapper.find('input').element.value).toBe('');
    expect(wrapper.find('input').classes()).toEqual(expect.arrayContaining(['app-input', 'pl-9']));
  });
});
