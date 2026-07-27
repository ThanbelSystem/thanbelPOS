import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseNum(value: string | number): number {
  if (typeof value === 'number') return value
  return parseFloat(value.replace(',', '.'))
}