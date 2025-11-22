import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Link, List, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';
import ProcessTaskItem from './ProcessTaskItem';
import TaskPlayScreen from './TaskPlayScreen';

const STORAGE_KEY = 'tasker-tasks';

function Process() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
  };

  const handleCloseTaskScreen = () => {
    setSelectedTask(null);
    leafTasksQueueRef.current = [];
    currentTaskIndexRef.current = 0;
    currentTopLevelTaskRef.current = null;
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

  const collectLeafTasks = useCallback((task: Task): Task[] => {
    const leafTasks: Task[] = [];

    // Если у задачи нет подзадач или они пустые - это листовая задача
    if (!task.subtasks || task.subtasks.length === 0) {
      // Добавляем только если она не выполнена
      if (task.status !== 'done') {
        leafTasks.push(task);
      }
    } else {
      // Если есть подзадачи, рекурсивно обходим каждую
      for (const subtask of task.subtasks) {
        leafTasks.push(...collectLeafTasks(subtask));
      }
    }

    return leafTasks;
  }, []);

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

  const moveToNextTask = useCallback(
    (updatedTasks: Task[]) => {
      // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
      leafTasksQueueRef.current = leafTasksQueueRef.current.map((task) => {
        const taskFromTree = findTaskInTree(updatedTasks, task.id);
        return taskFromTree || task;
      });

      // Синхронизируем индекс с текущей задачей перед переходом к следующей
      if (selectedTask) {
        const actualIndex = leafTasksQueueRef.current.findIndex((t) => t.id === selectedTask.id);
        if (actualIndex !== -1) {
          currentTaskIndexRef.current = actualIndex;
        }
      }

      const nextIndex = currentTaskIndexRef.current + 1;

      // Если в очереди есть следующая задача, запускаем её
      if (nextIndex < leafTasksQueueRef.current.length) {
        const nextTask = leafTasksQueueRef.current[nextIndex];
        currentTaskIndexRef.current = nextIndex;
        setSelectedTask(nextTask);
        return;
      }

      // Очередь закончилась, ищем следующую верхнюю задачу
      const nextTopLevelTask = findFirstIncompleteTask(updatedTasks);

      if (nextTopLevelTask) {
        const newLeafTasks = collectLeafTasks(nextTopLevelTask);

        if (newLeafTasks.length > 0) {
          // Есть невыполненные листовые задачи
          leafTasksQueueRef.current = newLeafTasks;
          currentTopLevelTaskRef.current = nextTopLevelTask;
          currentTaskIndexRef.current = 0;
          setSelectedTask(newLeafTasks[0]);
          return;
        } else {
          // Все листовые задачи выполнены, ищем следующую верхнюю задачу
          // Продолжаем поиск с следующей задачи после текущей
          const currentIndex = updatedTasks.findIndex(
            (t) => t.id === currentTopLevelTaskRef.current?.id,
          );
          const remainingTasks = updatedTasks.slice(currentIndex + 1);
          const nextTask = findFirstIncompleteTask(remainingTasks);

          if (nextTask) {
            const newLeafTasks = collectLeafTasks(nextTask);
            if (newLeafTasks.length > 0) {
              leafTasksQueueRef.current = newLeafTasks;
              currentTopLevelTaskRef.current = nextTask;
              currentTaskIndexRef.current = 0;
              setSelectedTask(newLeafTasks[0]);
              return;
            }
          }
        }
      }

      // Нет больше задач для выполнения
      setSelectedTask(null);
      leafTasksQueueRef.current = [];
      currentTaskIndexRef.current = 0;
      currentTopLevelTaskRef.current = null;
    },
    [findFirstIncompleteTask, collectLeafTasks, selectedTask, findTaskInTree],
  );

  const markTaskAsDone = (taskId: string) => {
    setTasks((prevTasks) => {
      // Помечаем задачу и все её подзадачи как выполненные
      let updated = updateTaskInTree(prevTasks, taskId, (task) => markTaskAndSubtasksAsDone(task));

      // Проверяем родителя и если все его дети выполнены, помечаем родителя тоже
      // Это работает рекурсивно вверх по дереву
      let parent = findParentTask(updated, taskId);
      while (parent) {
        if (areAllSubtasksDone(parent)) {
          updated = updateTaskInTree(updated, parent.id, (task) => ({
            ...task,
            status: 'done' as const,
          }));
          parent = findParentTask(updated, parent.id);
        } else {
          break;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Обновляем очередь, чтобы она содержала актуальные задачи из дерева
      leafTasksQueueRef.current = leafTasksQueueRef.current.map((task) => {
        const taskFromTree = findTaskInTree(updated, task.id);
        return taskFromTree || task;
      });

      // Обновляем selectedTask, если это та же задача
      if (selectedTask && selectedTask.id === taskId) {
        const updatedTask = findTaskInTree(updated, taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }

      return updated;
    });
  };

  const handleMoveToNext = () => {
    setTasks((prevTasks) => {
      // Переходим к следующей задаче
      setTimeout(() => {
        moveToNextTask(prevTasks);
      }, 0);
      return prevTasks;
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
      leafTasksQueueRef.current = leafTasksQueueRef.current.map((task) => {
        const taskFromTree = findTaskInTree(prevTasks, task.id);
        return taskFromTree || task;
      });

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
        canGoBack={canMoveToPrevious()}
      />
    </>
  );
}

export default Process;
