export type Accomplishment = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export type AccomplishmentStatuses = Record<string, boolean>;

export type TaskStatistics = {
  totalCompleted: number;
  completedInAfternoon: number;
  completedInEvening: number;
  completedInMorning: number;
  completedFasterThanTimer: number;
  consecutiveCompleted: number;
  unlockedAchievements: string[];
};

export type TaskCompletionData = {
  taskId: string;
  duration: number;
  actualTime: number;
  completedAt: Date;
  isConsecutive: boolean;
};
