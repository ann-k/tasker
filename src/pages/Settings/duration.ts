import type { Task } from './TaskItem';

export const DURATION_OPTIONS = [
  { label: '1 минута', seconds: 60 },
  { label: '3 минуты', seconds: 180 },
  { label: '5 минут', seconds: 300 },
  { label: '10 минут', seconds: 600 },
  { label: '15 минут', seconds: 900 },
  { label: '20 минут', seconds: 1200 },
  { label: '25 минут', seconds: 1500 },
  { label: '30 минут', seconds: 1800 },
  { label: '1 час', seconds: 3600 },
  { label: '2 часа', seconds: 7200 },
  { label: '3 часа', seconds: 10800 },
  { label: '4 часа', seconds: 14400 },
] as const;

export const formatDuration = (seconds: number): string => {
  const option = DURATION_OPTIONS.find((opt) => opt.seconds === seconds);
  return option?.label || `${Math.floor(seconds / 60)} минут`;
};

export const formatDurationWithSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const parseDuration = (label: string): number => {
  const option = DURATION_OPTIONS.find((opt) => opt.label === label);
  return option?.seconds || 60;
};

export const calculateSubtasksDuration = (subtasks?: Task[]): number => {
  if (!subtasks || subtasks.length === 0) {
    return 0;
  }
  return subtasks.reduce((total, task) => {
    const taskDuration =
      task.subtasks && task.subtasks.length > 0
        ? calculateSubtasksDuration(task.subtasks)
        : task.duration;
    return total + taskDuration;
  }, 0);
};
