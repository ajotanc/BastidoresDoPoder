import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário padrão para concatenação e mesclagem de classes CSS com Tailwind.
 * Segue o padrão shadcn-vue sem utilizar any ou unknown.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
