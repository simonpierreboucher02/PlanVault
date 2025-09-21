import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday, isSameDay } from 'date-fns';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function getCalendarDays(currentDate: Date, selectedDate?: Date): CalendarDay[] {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  
  // Get the first day of the week (Sunday = 0)
  const startDay = getDay(start);
  const endDay = getDay(end);
  
  // Calculate the calendar start (previous month days)
  const calendarStart = new Date(start);
  calendarStart.setDate(calendarStart.getDate() - startDay);
  
  // Calculate the calendar end (next month days)
  const calendarEnd = new Date(end);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - endDay));
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  return days.map(date => ({
    date,
    dayNumber: date.getDate(),
    isCurrentMonth: isSameMonth(date, currentDate),
    isToday: isToday(date),
    isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
  }));
}

export function getMonthName(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function navigateMonth(currentDate: Date, direction: 'next' | 'prev'): Date {
  return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
}

export function formatEventTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatEventDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatEventDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export const CATEGORY_COLORS = {
  work: 'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/20 dark:border-orange-400 dark:text-orange-200',
  personal: 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-400 dark:text-green-200',
  health: 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-200',
  finance: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-200',
} as const;

export function getCategoryColor(category: keyof typeof CATEGORY_COLORS): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.personal;
}
