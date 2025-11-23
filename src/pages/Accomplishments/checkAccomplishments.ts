import { ACCOMPLISHMENTS } from './constants';
import { type TaskStatistics } from './types';

export const checkAccomplishments = (stats: TaskStatistics): string[] => {
  const newAchievements: string[] = [];

  for (const accomplishment of ACCOMPLISHMENTS) {
    // Пропускаем уже полученные достижения
    if (stats.unlockedAchievements.includes(accomplishment.id)) {
      continue;
    }

    let conditionMet = false;

    switch (accomplishment.id) {
      case '1': // Успех - Выполнить первую задачу
        conditionMet = stats.totalCompleted >= 1;
        break;

      case '2': // Чемпион - 5 задач быстрее таймера
        conditionMet = stats.completedFasterThanTimer >= 5;
        break;

      case '3': // Супер чемпион - 10 задач быстрее таймера
        conditionMet = stats.completedFasterThanTimer >= 10;
        break;

      case '4': // Всё по порядку - 5 задач подряд
        conditionMet = stats.consecutiveCompleted >= 5;
        break;

      case '5': // Гора дел - 10 задач подряд
        conditionMet = stats.consecutiveCompleted >= 10;
        break;

      case '6': // Вечеринка - 5 задач вечером
        conditionMet = stats.completedInEvening >= 5;
        break;

      case '7': // Солнышко - 5 задач днём
        conditionMet = stats.completedInAfternoon >= 5;
        break;

      case '8': // Ранняя пташка - 5 задач утром
        conditionMet = stats.completedInMorning >= 5;
        break;

      default:
        break;
    }

    if (conditionMet) {
      newAchievements.push(accomplishment.id);
    }
  }

  return newAchievements;
};
