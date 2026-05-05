import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusLabel = (status: string, lang: string) => {
  if (lang === 'sv') {
    const map: Record<string, string> = {
      'Applied': 'Ansökt',
      'Interviewing': 'Intervju',
      'Rejected': 'Avslag',
      'Offer': 'Erbjudande',
      'Saved': 'Sparad',
    }
    return map[status] || status
  }
  return status
}