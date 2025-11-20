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
    setSelectedTask(task);
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

  const markTaskAndSubtasksAsDone = (task: Task): Task => {
    return {
      ...task,
      status: 'done' as const,
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => markTaskAndSubtasksAsDone(subtask))
        : undefined,
    };
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

  const moveToNextTask = useCallback(
    (updatedTasks: Task[]) => {
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
    [findFirstIncompleteTask, collectLeafTasks],
  );

  const handleTaskComplete = (taskId: string) => {
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

      // Переходим к следующей задаче после обновления
      setTimeout(() => {
        moveToNextTask(updated);
      }, 0);

      return updated;
    });
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
      <meta name="title" content="Процесс" />
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
          Процесс
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
        onComplete={handleTaskComplete}
      />
    </>
  );
}

export default Process;
