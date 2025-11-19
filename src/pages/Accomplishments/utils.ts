import { type AccomplishmentStatuses } from './types';

const STORAGE_KEY = 'tasker-accomplishments-statuses';

export const loadAccomplishmentStatuses = (): AccomplishmentStatuses => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveAccomplishmentStatuses = (statuses: AccomplishmentStatuses): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error('Failed to save accomplishment statuses:', error);
  }
};

export const updateAccomplishmentStatus = (
  id: string,
  completed: boolean,
  currentStatuses: AccomplishmentStatuses,
): AccomplishmentStatuses => {
  const updated = { ...currentStatuses, [id]: completed };
  saveAccomplishmentStatuses(updated);
  return updated;
};
