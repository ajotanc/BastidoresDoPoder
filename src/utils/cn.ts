import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário padrão para concatenação e mesclagem de classes CSS com Tailwind.
 * Aceita os valores de classe definidos pelo clsx e resolve conflitos do Tailwind.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
