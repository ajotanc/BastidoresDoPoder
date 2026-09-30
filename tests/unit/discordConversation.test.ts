import { afterEach, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DiscordConversation from '@/components/online/DiscordConversation.vue';
afterEach(()=>vi.useRealTimers());
it('shows only valid, unexpired links and disables the link at expiry',async()=>{
 vi.useFakeTimers();const wrapper=mount(DiscordConversation,{props:{conversation:{status:'ready',url:'https://discord.gg/abc',expiresAt:Date.now()+1000}}});
 expect(wrapper.get('a').attributes('href')).toBe('https://discord.gg/abc');
 await vi.advanceTimersByTimeAsync(1001);expect(wrapper.find('a').exists()).toBe(false);expect(wrapper.text()).toContain('expirou');
 await wrapper.setProps({conversation:{status:'ready',url:'javascript:alert(1)',expiresAt:Date.now()+1000}});expect(wrapper.find('a').exists()).toBe(false);wrapper.unmount();
});
it('only the host can retry after the cooldown or connect Discord',async()=>{
 vi.useFakeTimers();const wrapper=mount(DiscordConversation,{props:{canRetry:true,conversation:{status:'error',retryAt:Date.now()+1000}}});
 expect(wrapper.get('button').attributes('disabled')).toBeDefined();await vi.advanceTimersByTimeAsync(1001);await wrapper.get('button').trigger('click');expect(wrapper.emitted('retry')).toHaveLength(1);
 await wrapper.setProps({conversation:{status:'auth-required'}});expect(wrapper.text()).toContain('Conectar Discord');
 await wrapper.setProps({canRetry:false});expect(wrapper.get('button').attributes('disabled')).toBeDefined();wrapper.unmount();
});
