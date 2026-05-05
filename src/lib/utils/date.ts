import { format, isToday, isBefore, addDays, startOfDay, endOfDay, parseISO } from 'date-fns'

export function getFollowUpStatus(dateStr: string) {
  if (!dateStr) return null
  
  const today = startOfDay(new Date())
  const date = startOfDay(parseISO(dateStr))
  
  if (isBefore(date, today)) return 'overdue'
  if (isToday(date)) return 'today'
  
  const next7Days = endOfDay(addDays(today, 7))
  if (isBefore(date, next7Days)) return 'soon'
  
  return 'future'
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return format(parseISO(dateStr), 'MMM d, yyyy')
}
