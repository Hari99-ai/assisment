export const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function isValidDate(value) {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function normalizeEnum(value) {
  return String(value || '').trim().toUpperCase();
}

