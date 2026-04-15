import moment from 'moment';

/**
 * Format a date string or timestamp to a human-readable format
 * @param date Date string or timestamp
 * @param format Format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns Formatted date string
 */
export function formatDate(date?: string | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-';

  try {
    return moment(date).format(format);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(date);
  }
}

/**
 * Format a date to relative time (e.g., 3 hours ago)
 * @param date Date string or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date?: string | number): string {
  if (!date) return '-';

  try {
    return moment(date).fromNow();
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return String(date);
  }
}