import { type AccomplishmentStatuses, type TaskCompletionData, type TaskStatistics } from './types';

const STATISTICS_STORAGE_KEY = 'tasker-task-statistics';

// Вычисляем статусы достижений из статистики
export const getAccomplishmentStatuses = (stats: TaskStatistics): AccomplishmentStatuses => {
  const statuses: AccomplishmentStatuses = {};
  for (const achievementId of stats.unlockedAchievements) {
    statuses[achievementId] = true;
  }
  return statuses;
};

// Загружаем статусы из статистики (для обратной совместимости)
export const loadAccomplishmentStatuses = (): AccomplishmentStatuses => {
  const stats = loadTaskStatistics();
  return getAccomplishmentStatuses(stats);
};

// Обновляем статус достижения в статистике
export const updateAccomplishmentStatus = (
  id: string,
  completed: boolean,
  currentStats: TaskStatistics,
): TaskStatistics => {
  const updated = { ...currentStats };
  if (completed) {
    if (!updated.unlockedAchievements.includes(id)) {
      updated.unlockedAchievements = [...updated.unlockedAchievements, id];
    }
  } else {
    updated.unlockedAchievements = updated.unlockedAchievements.filter((aid) => aid !== id);
  }
  saveTaskStatistics(updated);
  return updated;
};

export const loadTaskStatistics = (): TaskStatistics => {
  try {
    const saved = localStorage.getItem(STATISTICS_STORAGE_KEY);
    if (saved) {
      const stats = JSON.parse(saved);
      // Добавляем unlockedAchievements, если его нет
      if (!stats.unlockedAchievements) {
        stats.unlockedAchievements = [];
        saveTaskStatistics(stats);
      }
      return stats;
    }
  } catch (error) {
    console.error('Failed to load task statistics:', error);
  }
  return {
    totalCompleted: 0,
    completedInAfternoon: 0,
    completedInEvening: 0,
    completedInMorning: 0,
    completedFasterThanTimer: 0,
    consecutiveCompleted: 0,
    unlockedAchievements: [],
  };
};

export const saveTaskStatistics = (stats: TaskStatistics): void => {
  try {
    localStorage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save task statistics:', error);
  }
};

export const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
  const hours = date.getHours();
  // Вечер: 17:00 - 05:00 (следующего дня)
  if (hours >= 17 || hours < 5) {
    return 'evening';
  }
  // Утро: 00:00 - 12:00
  if (hours < 12) {
    return 'morning';
  }
  // День: 12:00 - 17:00
  return 'afternoon';
};

export const updateTaskStatistics = (
  completionData: TaskCompletionData,
  currentStats: TaskStatistics,
): TaskStatistics => {
  const updated = { ...currentStats };

  // Увеличиваем общее количество выполненных задач
  updated.totalCompleted += 1;

  // Определяем время суток и увеличиваем соответствующий счетчик
  const timeOfDay = getTimeOfDay(completionData.completedAt);
  if (timeOfDay === 'morning') {
    updated.completedInMorning += 1;
  } else if (timeOfDay === 'afternoon') {
    updated.completedInAfternoon += 1;
  } else {
    updated.completedInEvening += 1;
  }

  // Проверяем, выполнена ли задача быстрее таймера
  if (completionData.actualTime < completionData.duration) {
    updated.completedFasterThanTimer += 1;
  }

  // Обновляем счетчик подряд
  if (completionData.isConsecutive) {
    updated.consecutiveCompleted += 1;
  } else {
    // Если задача не выполнена подряд, сбрасываем счетчик
    updated.consecutiveCompleted = 0;
  }

  saveTaskStatistics(updated);
  return updated;
};

export const resetConsecutiveCounter = (): void => {
  const stats = loadTaskStatistics();
  if (stats.consecutiveCompleted > 0) {
    stats.consecutiveCompleted = 0;
    saveTaskStatistics(stats);
  }
};
