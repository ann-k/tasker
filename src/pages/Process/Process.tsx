import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Link, List, Typography } from '@mui/material';

import AchievementNotification from '../Accomplishments/AchievementNotification';
import { checkAccomplishments } from '../Accomplishments/checkAccomplishments';
import { ACCOMPLISHMENTS } from '../Accomplishments/constants';
import { type Accomplishment } from '../Accomplishments/types';
import {
  loadTaskStatistics,
  resetConsecutiveCounter,
  updateAccomplishmentStatus,
  updateTaskStatistics,
} from '../Accomplishments/utils';
import { type Task } from '../Settings/TaskItem';
import ProcessTaskItem from './ProcessTaskItem';
import TaskPlayScreen from './TaskPlayScreen';

const STORAGE_KEY = 'tasker-tasks';

function Process() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isConsecutiveSession, setIsConsecutiveSession] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Accomplishment[]>([]);
  const [fireworksCompleted, setFireworksCompleted] = useState(false);
  const [pendingAchievements, setPendingAchievements] = useState<Accomplishment[]>([]);
  const leafTasksQueueRef = useRef<Task[]>([]);
  const currentTaskIndexRef = useRef<number>(0);
  const currentTopLevelTaskRef = useRef<Task | null>(null);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleTaskSelect = (task: Task) => {
    // Если задача была выполнена, сбрасываем статус на 'to-do' при начале воспроизведения
    if (task.status === 'done') {
      setTasks((prevTasks) => {
        const updated = resetTaskAndParentsStatus(prevTasks, task.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        const updatedTask = findTaskInTree(updated, task.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
        return updated;
      });
    } else {
      setSelectedTask(task);
    }
    // Если сессия не была прервана, устанавливаем флаг подряд
    if (!isConsecutiveSession) {
      setIsConsecutiveSession(true);
    }
  };

  const findSiblings = useCallback((tasksList: Task[], taskId: string): Task[] => {
    // Ищем задачу на верхнем уровне
    const topLevelIndex = tasksList.findIndex((t) => t.id === taskId);
    if (topLevelIndex !== -1) {
      return tasksList;
    }

    // Ищем в подзадачах
    for (const t of tasksList) {
      if (t.subtasks && t.subtasks.length > 0) {
        const subtaskIndex = t.subtasks.findIndex((subtask) => subtask.id === taskId);
        if (subtaskIndex !== -1) {
          return t.subtasks;
        }
        const found = findSiblings(t.subtasks, taskId);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  }, []);

  const handlePlayClick = (task: Task) => {
    // Find the parent task
    const parent = findParentTask(tasks, task.id);

    if (parent) {
      // If task has a parent, collect all leaf tasks from parent
      const allLeafTasks = collectAllLeafTasks(parent);
      const incompleteLeafTasks = allLeafTasks.filter((t) => t.status !== 'done');

      // Find the index of the selected task in the queue
      const taskIndex = incompleteLeafTasks.findIndex((t) => t.id === task.id);
      if (taskIndex !== -1) {
        // Start from the selected task and continue with remaining tasks
        const remainingTasks = incompleteLeafTasks.slice(taskIndex);
        leafTasksQueueRef.current = remainingTasks;
        currentTopLevelTaskRef.current = parent;
        currentTaskIndexRef.current = 0;
        handleTaskSelect(remainingTasks[0]);
      }
    } else {
      // If task is top-level, collect all leaf tasks from it and its siblings
      const siblings = findSiblings(tasks, task.id);
      const taskIndex = siblings.findIndex((t) => t.id === task.id);

      if (taskIndex !== -1) {
        // Collect leaf tasks from this task and all remaining siblings
        const remainingSiblings = siblings.slice(taskIndex);
        const allLeafTasks: Task[] = [];

        for (const sibling of remainingSiblings) {
          allLeafTasks.push(...collectAllLeafTasks(sibling));
        }

        const incompleteLeafTasks = allLeafTasks.filter((t) => t.status !== 'done');
        const selectedTaskIndex = incompleteLeafTasks.findIndex((t) => t.id === task.id);

        if (selectedTaskIndex !== -1) {
          // Start from the selected task and continue with remaining tasks
          const remainingTasks = incompleteLeafTasks.slice(selectedTaskIndex);
          leafTasksQueueRef.current = remainingTasks;
          // Store the first sibling as the top-level task reference
          currentTopLevelTaskRef.current = remainingSiblings[0];
          currentTaskIndexRef.current = 0;
          handleTaskSelect(remainingTasks[0]);
        }
      }
    }
  };

  const handleCloseTaskScreen = () => {
    setSelectedTask(null);
    leafTasksQueueRef.current = [];
    currentTaskIndexRef.current = 0;
    currentTopLevelTaskRef.current = null;

    // Сбрасываем счетчик подряд при закрытии экрана
    resetConsecutiveCounter();
    setIsConsecutiveSession(false);
    setFireworksCompleted(false);
    setPendingAchievements([]);
    setNewAchievements([]);
  };

  const updateTaskInTree = (
    tasksList: Task[],
    taskId: string,
    updater: (task: Task) => Task,
  ): Task[] => {
    return tasksList.map((task) => {
      if (task.id === taskId) {
        return updater(task);
      }
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: updateTaskInTree(task.subtasks, taskId, updater),
        };
      }
      return task;
    });
  };

  const findTaskInTree = useCallback((tasksList: Task[], taskId: string): Task | null => {
    for (const task of tasksList) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findTaskInTree(task.subtasks, taskId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }, []);

  const markTaskAndSubtasksAsDone = (task: Task): Task => {
    return {
      ...task,
      status: 'done' as const,
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => markTaskAndSubtasksAsDone(subtask))
        : undefined,
    };
  };

  const resetTaskStatus = (task: Task): Task => {
    return {
      ...task,
      status: 'to-do' as const,
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => resetTaskStatus(subtask))
        : undefined,
    };
  };

  const resetTaskAndParentsStatus = (tasksList: Task[], taskId: string): Task[] => {
    // Сбрасываем статус самой задачи и всех её подзадач
    let updated = updateTaskInTree(tasksList, taskId, (task) => resetTaskStatus(task));

    // Сбрасываем статус всех родительских задач рекурсивно вверх по дереву
    let parent = findParentTask(updated, taskId);
    while (parent) {
      updated = updateTaskInTree(updated, parent.id, (task) => ({
        ...task,
        status: 'to-do' as const,
      }));
      parent = findParentTask(updated, parent.id);
    }

    return updated;
  };

  const areAllSubtasksDone = (task: Task): boolean => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.status === 'done';
    }
    return task.subtasks.every((subtask) => areAllSubtasksDone(subtask));
  };

  const findParentTask = (
    tasksList: Task[],
    taskId: string,
    parent: Task | null = null,
  ): Task | null => {
    for (const task of tasksList) {
      if (task.id === taskId) {
        return parent;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findParentTask(task.subtasks, taskId, task);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  };

  const findFirstIncompleteTask = useCallback((tasksList: Task[]): Task | null => {
    for (const task of tasksList) {
      if (task.status !== 'done') {
        return task;
      }
    }
    return null;
  }, []);

  const hasIncompleteTasks = (tasksList: Task[]): boolean => {
    return findFirstIncompleteTask(tasksList) !== null;
  };

  const collectAllLeafTasks = useCallback((task: Task): Task[] => {
    const leafTasks: Task[] = [];

    // Если у задачи нет подзадач или они пустые - это листовая задача
    if (!task.subtasks || task.subtasks.length === 0) {
      // Добавляем все листовые задачи, включая выполненные (для навигации назад)
      leafTasks.push(task);
    } else {
      // Если есть подзадачи, рекурсивно обходим каждую
      for (const subtask of task.subtasks) {
        leafTasks.push(...collectAllLeafTasks(subtask));
      }
    }

    return leafTasks;
  }, []);

  const collectLeafTasks = useCallback(
    (task: Task): Task[] => {
      // Сначала собираем все листовые задачи в правильном порядке (включая выполненные)
      const allLeafTasks = collectAllLeafTasks(task);
      // Затем фильтруем только невыполненные, сохраняя порядок
      return allLeafTasks.filter((t) => t.status !== 'done');
    },
    [collectAllLeafTasks],
  );

  const moveToNextTask = useCallback(
    (updatedTasks: Task[]) => {
      // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
      // И фильтруем выполненные задачи
      const updatedQueue = leafTasksQueueRef.current
        .map((task) => {
          const taskFromTree = findTaskInTree(updatedTasks, task.id);
          return taskFromTree || task;
        })
        .filter((t) => t.status !== 'done');

      // Если очередь стала пустой или текущая задача не найдена, пересобираем очередь
      // Это важно для верхнеуровневых задач без детей
      if (
        updatedQueue.length === 0 ||
        (selectedTask && !updatedQueue.find((t) => t.id === selectedTask.id))
      ) {
        if (currentTopLevelTaskRef.current) {
          // Пересобираем очередь из текущей верхнеуровневой задачи и её сиблингов
          const siblings = findSiblings(updatedTasks, currentTopLevelTaskRef.current.id);
          const currentIndex = siblings.findIndex(
            (t) => t.id === currentTopLevelTaskRef.current?.id,
          );

          if (currentIndex !== -1) {
            // Если текущая верхнеуровневая задача выполнена, начинаем со следующей
            const startIndex =
              siblings[currentIndex].status === 'done' ? currentIndex + 1 : currentIndex;
            if (startIndex < siblings.length) {
              const remainingSiblings = siblings.slice(startIndex);
              const allLeafTasks: Task[] = [];
              for (const sibling of remainingSiblings) {
                allLeafTasks.push(...collectAllLeafTasks(sibling));
              }
              const filteredTasks = allLeafTasks.filter((t) => t.status !== 'done');
              if (filteredTasks.length > 0) {
                leafTasksQueueRef.current = filteredTasks;
                // Обновляем currentTopLevelTaskRef на первую невыполненную задачу
                currentTopLevelTaskRef.current = remainingSiblings[0];
              } else {
                leafTasksQueueRef.current = updatedQueue;
              }
            } else {
              leafTasksQueueRef.current = updatedQueue;
            }
          } else {
            leafTasksQueueRef.current = updatedQueue;
          }
        } else {
          leafTasksQueueRef.current = updatedQueue;
        }
      } else {
        leafTasksQueueRef.current = updatedQueue;
      }

      // Синхронизируем индекс с текущей задачей перед переходом к следующей
      if (selectedTask) {
        const actualIndex = leafTasksQueueRef.current.findIndex((t) => t.id === selectedTask.id);
        if (actualIndex !== -1) {
          currentTaskIndexRef.current = actualIndex;
        } else {
          // Если текущая задача не найдена в очереди (была выполнена и удалена),
          // следующая задача должна быть с индексом 0 (первая в очереди)
          // Устанавливаем индекс на -1, чтобы nextIndex стал 0
          currentTaskIndexRef.current = -1;
        }
      }

      const nextIndex = currentTaskIndexRef.current + 1;

      // Если в очереди есть следующая задача, запускаем её
      if (nextIndex < leafTasksQueueRef.current.length) {
        const nextTask = leafTasksQueueRef.current[nextIndex];
        currentTaskIndexRef.current = nextIndex;
        setSelectedTask(nextTask);
        // Сохраняем сессию подряд при переходе к следующей задаче
        setIsConsecutiveSession(true);
        return;
      }

      // Очередь закончилась, ищем сиблингов текущей задачи
      if (currentTopLevelTaskRef.current) {
        // Find siblings of the current top-level task
        const siblings = findSiblings(updatedTasks, currentTopLevelTaskRef.current.id);
        const currentIndex = siblings.findIndex((t) => t.id === currentTopLevelTaskRef.current?.id);

        if (currentIndex !== -1 && currentIndex < siblings.length - 1) {
          // There are siblings after the current task
          const remainingSiblings = siblings.slice(currentIndex + 1);

          // Collect leaf tasks from remaining siblings
          const allLeafTasks: Task[] = [];
          for (const sibling of remainingSiblings) {
            allLeafTasks.push(...collectAllLeafTasks(sibling));
          }

          const incompleteLeafTasks = allLeafTasks.filter((t) => t.status !== 'done');

          if (incompleteLeafTasks.length > 0) {
            leafTasksQueueRef.current = incompleteLeafTasks;
            // Update currentTopLevelTaskRef to the first remaining sibling
            currentTopLevelTaskRef.current = remainingSiblings[0];
            currentTaskIndexRef.current = 0;
            setSelectedTask(incompleteLeafTasks[0]);
            // Сохраняем сессию подряд при переходе к следующей задаче
            setIsConsecutiveSession(true);
            return;
          }
        }
      }

      // No more siblings, find next top-level task
      const currentTopLevelIndex = currentTopLevelTaskRef.current
        ? updatedTasks.findIndex((t) => t.id === currentTopLevelTaskRef.current?.id)
        : -1;
      const remainingTasks =
        currentTopLevelIndex >= 0 ? updatedTasks.slice(currentTopLevelIndex + 1) : updatedTasks;
      const nextTopLevelTask = findFirstIncompleteTask(remainingTasks);

      if (nextTopLevelTask) {
        const allLeafTasks = collectAllLeafTasks(nextTopLevelTask);
        const newLeafTasks = allLeafTasks.filter((t) => t.status !== 'done');

        if (newLeafTasks.length > 0) {
          // Есть невыполненные листовые задачи
          leafTasksQueueRef.current = newLeafTasks;
          currentTopLevelTaskRef.current = nextTopLevelTask;
          currentTaskIndexRef.current = 0;
          setSelectedTask(newLeafTasks[0]);
          // Сохраняем сессию подряд при переходе к следующей задаче
          setIsConsecutiveSession(true);
          return;
        }
      }

      // Нет больше задач для выполнения
      setSelectedTask(null);
      leafTasksQueueRef.current = [];
      currentTaskIndexRef.current = 0;
      currentTopLevelTaskRef.current = null;
    },
    [findFirstIncompleteTask, collectAllLeafTasks, findSiblings, selectedTask, findTaskInTree],
  );

  const markTaskAsDone = (taskId: string, actualTime: number) => {
    setTasks((prevTasks) => {
      // Находим задачу до обновления для получения данных
      const task = findTaskInTree(prevTasks, taskId);
      if (!task) {
        return prevTasks;
      }

      // Помечаем задачу и все её подзадачи как выполненные
      let updated = updateTaskInTree(prevTasks, taskId, (t) => markTaskAndSubtasksAsDone(t));

      // Проверяем родителя и если все его дети выполнены, помечаем родителя тоже
      // Это работает рекурсивно вверх по дереву
      let parent = findParentTask(updated, taskId);
      while (parent) {
        if (areAllSubtasksDone(parent)) {
          updated = updateTaskInTree(updated, parent.id, (t) => ({
            ...t,
            status: 'done' as const,
          }));
          parent = findParentTask(updated, parent.id);
        } else {
          break;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
      // И фильтруем выполненные задачи
      leafTasksQueueRef.current = leafTasksQueueRef.current
        .map((t) => {
          const taskFromTree = findTaskInTree(updated, t.id);
          return taskFromTree || t;
        })
        .filter((t) => t.status !== 'done');

      // Обновляем selectedTask, если это та же задача
      if (selectedTask && selectedTask.id === taskId) {
        const updatedTask = findTaskInTree(updated, taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }

      // Синхронизируем индекс после фильтрации выполненных задач
      if (selectedTask) {
        const actualIndex = leafTasksQueueRef.current.findIndex((t) => t.id === selectedTask.id);
        if (actualIndex !== -1) {
          currentTaskIndexRef.current = actualIndex;
        } else {
          // Если текущая задача не найдена в очереди (была выполнена и удалена),
          // следующая задача должна быть с индексом 0 (первая в очереди)
          // Устанавливаем индекс на -1, чтобы nextIndex стал 0
          currentTaskIndexRef.current = -1;
        }
      }

      // Обновляем статистику и проверяем достижения
      const stats = loadTaskStatistics();

      const updatedStats = updateTaskStatistics(
        {
          taskId,
          duration: task.duration,
          actualTime,
          completedAt: new Date(),
          isConsecutive: isConsecutiveSession,
        },
        stats,
      );

      // Проверяем достижения
      const newAchievementIds = checkAccomplishments(updatedStats);

      // Сбрасываем состояние фейерверков при завершении новой задачи
      setFireworksCompleted(false);

      if (newAchievementIds.length > 0) {
        // Обновляем статусы достижений в статистике
        let finalStats = updatedStats;
        const newAchievementsList: Accomplishment[] = [];

        for (const achievementId of newAchievementIds) {
          finalStats = updateAccomplishmentStatus(achievementId, true, finalStats);
          const accomplishment = ACCOMPLISHMENTS.find((acc) => acc.id === achievementId);
          if (accomplishment) {
            newAchievementsList.push(accomplishment);
          }
        }

        // Сохраняем достижения для показа после фейерверков
        setPendingAchievements(newAchievementsList);
      }

      return updated;
    });
  };

  const handleMoveToNext = () => {
    // Get current tasks and call moveToNextTask
    setTasks((currentTasks) => {
      moveToNextTask(currentTasks);
      return currentTasks;
    });
  };

  const canMoveToPrevious = useCallback((): boolean => {
    // Если есть предыдущая задача в текущей очереди
    if (currentTaskIndexRef.current > 0) {
      return true;
    }

    // Если это первая задача в очереди, проверяем, есть ли предыдущая верхняя задача
    if (currentTopLevelTaskRef.current) {
      const currentIndex = tasks.findIndex((t) => t.id === currentTopLevelTaskRef.current?.id);
      return currentIndex > 0;
    }

    return false;
  }, [tasks]);

  const moveToPreviousTask = () => {
    setTasks((prevTasks) => {
      let previousTask: Task | null = null;

      if (!selectedTask) {
        return prevTasks;
      }

      // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
      // И фильтруем выполненные задачи
      leafTasksQueueRef.current = leafTasksQueueRef.current
        .map((task) => {
          const taskFromTree = findTaskInTree(prevTasks, task.id);
          return taskFromTree || task;
        })
        .filter((t) => t.status !== 'done');

      // Всегда находим индекс текущей задачи по её ID в очереди
      const currentTaskIndex = leafTasksQueueRef.current.findIndex((t) => t.id === selectedTask.id);

      // Если задача не найдена в очереди, значит мы в неправильном состоянии
      if (currentTaskIndex === -1) {
        return prevTasks;
      }

      // Обновляем ref для синхронизации
      currentTaskIndexRef.current = currentTaskIndex;

      // Если есть предыдущая задача в текущей очереди
      if (currentTaskIndex > 0) {
        const prevIndex = currentTaskIndex - 1;
        previousTask = leafTasksQueueRef.current[prevIndex];
        currentTaskIndexRef.current = prevIndex;
      } else {
        // Ищем предыдущую верхнюю задачу
        if (currentTopLevelTaskRef.current) {
          const currentIndex = prevTasks.findIndex(
            (t) => t.id === currentTopLevelTaskRef.current?.id,
          );

          if (currentIndex > 0) {
            // Берем предыдущую верхнюю задачу
            const previousTopLevelTask = prevTasks[currentIndex - 1];
            const allLeafTasks = collectAllLeafTasks(previousTopLevelTask);

            if (allLeafTasks.length > 0) {
              // Берем последнюю листовую задачу из предыдущей верхней задачи
              previousTask = allLeafTasks[allLeafTasks.length - 1];
              leafTasksQueueRef.current = allLeafTasks;
              currentTopLevelTaskRef.current = previousTopLevelTask;
              currentTaskIndexRef.current = allLeafTasks.length - 1;
            }
          }
        }
      }

      if (previousTask) {
        // Сбрасываем статус задачи на 'to-do', если она была выполнена
        let updated = prevTasks;
        if (previousTask.status === 'done') {
          updated = resetTaskAndParentsStatus(prevTasks, previousTask.id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          // Обновляем previousTask из обновленного дерева
          const updatedTask = findTaskInTree(updated, previousTask.id);
          if (updatedTask) {
            previousTask = updatedTask;
          }
          // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
          leafTasksQueueRef.current = leafTasksQueueRef.current.map((task) => {
            const taskFromTree = findTaskInTree(updated, task.id);
            return taskFromTree || task;
          });
        }

        setSelectedTask(previousTask);
        return updated;
      }

      return prevTasks;
    });
  };

  const handleMoveToPrevious = () => {
    moveToPreviousTask();
  };

  // Автоматически помечаем родительские задачи как выполненные, если все их дети выполнены
  useEffect(() => {
    setTasks((prevTasks) => {
      let updated = [...prevTasks];
      let changed = true;

      // Повторяем проверку, пока есть изменения (для обработки вложенных структур)
      while (changed) {
        changed = false;
        const beforeUpdate = JSON.stringify(updated);

        // Проверяем каждую задачу верхнего уровня
        updated = updated.map((task) => {
          if (task.status === 'done') {
            return task;
          }

          // Если все подзадачи выполнены, помечаем задачу как выполненную
          if (areAllSubtasksDone(task)) {
            changed = true;
            return {
              ...task,
              status: 'done' as const,
              subtasks: task.subtasks
                ? task.subtasks.map((subtask) => markTaskAndSubtasksAsDone(subtask))
                : undefined,
            };
          }

          // Рекурсивно обновляем подзадачи
          if (task.subtasks && task.subtasks.length > 0) {
            const updatedSubtasks = task.subtasks.map((subtask) => {
              if (subtask.status === 'done') {
                return subtask;
              }
              if (areAllSubtasksDone(subtask)) {
                changed = true;
                return {
                  ...subtask,
                  status: 'done' as const,
                  subtasks: subtask.subtasks
                    ? subtask.subtasks.map((st) => markTaskAndSubtasksAsDone(st))
                    : undefined,
                };
              }
              return subtask;
            });
            return { ...task, subtasks: updatedSubtasks };
          }

          return task;
        });

        // Если ничего не изменилось, выходим из цикла
        if (JSON.stringify(updated) === beforeUpdate) {
          break;
        }
      }

      // Сохраняем только если были изменения
      if (JSON.stringify(updated) !== JSON.stringify(prevTasks)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }

      return prevTasks;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняем только при монтировании компонента для проверки существующих задач

  // Handle taskId from URL
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks.length > 0) {
      const task = findTaskInTree(tasks, taskId);
      if (task) {
        // Find the top-level parent task
        let topLevelTask = task;
        let parent = findParentTask(tasks, taskId);
        while (parent) {
          topLevelTask = parent;
          parent = findParentTask(tasks, parent.id);
        }

        // Collect all leaf tasks from the top-level task
        const leafTasks = collectLeafTasks(topLevelTask);

        if (leafTasks.length > 0) {
          // Find the index of the selected task in the queue
          const taskIndex = leafTasks.findIndex((t) => t.id === taskId);
          if (taskIndex !== -1) {
            leafTasksQueueRef.current = leafTasks;
            currentTopLevelTaskRef.current = topLevelTask;
            currentTaskIndexRef.current = taskIndex;
            handleTaskSelect(leafTasks[taskIndex]);
            // Clear the URL parameter
            setSearchParams({});
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tasks]);

  const handleStartFirstTask = () => {
    const firstIncompleteTask = findFirstIncompleteTask(tasks);
    if (firstIncompleteTask) {
      // Собираем все невыполненные листовые подзадачи
      const leafTasks = collectLeafTasks(firstIncompleteTask);

      if (leafTasks.length > 0) {
        // Сохраняем очередь и текущую верхнюю задачу
        leafTasksQueueRef.current = leafTasks;
        currentTopLevelTaskRef.current = firstIncompleteTask;
        currentTaskIndexRef.current = 0;
        // Запускаем первую листовую задачу
        handleTaskSelect(leafTasks[0]);
      }
    }
  };

  return (
    <>
      <meta name="title" content="Расписание" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          p: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 500,
            mb: 2,
            color: 'text.primary',
            lineHeight: 1.2,
          }}
        >
          Расписание
        </Typography>

        {tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте задачи в расписание
            </Typography>
            <Link
              component="button"
              variant="body1"
              onClick={() => navigate('/settings')}
              sx={{ cursor: 'pointer' }}
            >
              Перейти в настройки
            </Link>
          </Box>
        ) : (
          <>
            {hasIncompleteTasks(tasks) && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartFirstTask}
                sx={{
                  mb: 3,
                  py: 2,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  bgcolor: '#9c27b0',
                  '&:hover': {
                    bgcolor: '#7b1fa2',
                  },
                }}
              >
                Запустить
              </Button>
            )}
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {tasks.map((task) => (
                <ProcessTaskItem
                  key={task.id}
                  id={task.id}
                  name={task.name}
                  duration={task.duration}
                  image={task.image}
                  status={task.status}
                  subtasks={task.subtasks}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                  onPlayClick={() => handlePlayClick(task)}
                />
              ))}
            </List>
          </>
        )}
      </Box>

      <TaskPlayScreen
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={handleCloseTaskScreen}
        onMarkComplete={markTaskAsDone}
        onMoveToNext={handleMoveToNext}
        onMoveToPrevious={handleMoveToPrevious}
        canGoBack={
          (selectedTask?.status !== 'done' ||
            (selectedTask?.status === 'done' &&
              fireworksCompleted &&
              newAchievements.length === 0 &&
              pendingAchievements.length === 0)) &&
          canMoveToPrevious()
        }
        onFireworksComplete={() => {
          setFireworksCompleted(true);
          // Показываем достижения после завершения фейерверков
          if (pendingAchievements.length > 0) {
            setNewAchievements(pendingAchievements);
            setPendingAchievements([]);
          }
          // Если достижений нет, кнопка "К следующей задаче" станет видимой сразу
        }}
        showNextButton={
          selectedTask?.status === 'done' &&
          fireworksCompleted &&
          newAchievements.length === 0 &&
          pendingAchievements.length === 0
        }
      />

      <AchievementNotification
        achievements={newAchievements}
        open={newAchievements.length > 0 && fireworksCompleted}
        onClose={() => {
          setNewAchievements([]);
          // Не сбрасываем fireworksCompleted, чтобы кнопка "К следующей задаче" оставалась видимой
        }}
      />
    </>
  );
}

export default Process;
