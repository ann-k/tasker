import { useCallback, useEffect, useRef, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  Button,
  List,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

import { deleteImage, generateImageId, saveImage } from '@/utils/imageStorage';

import CreateTaskDialog from './CreateTaskDialog';
import TaskItem, { type Task } from './TaskItem';
import { formatDuration, parseDuration } from './duration';

const STORAGE_KEY = 'tasker-tasks';
const DEBOUNCE_DELAY = 500;

const generateTaskId = (): string => {
  return crypto.randomUUID();
};

function Settings() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [editingTask, setEditingTask] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('1 минута');
  const [durationDialogMode, setDurationDialogMode] = useState<'create' | 'edit'>('create');
  const [editingDurationTaskId, setEditingDurationTaskId] = useState<string | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);

  const findTaskInTree = (tasksList: Task[], taskId: string): Task | null => {
    for (const task of tasksList) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findTaskInTree(task.subtasks, taskId);
        if (found) return found;
      }
    }
    return null;
  };

  const updateTaskInTree = useCallback(
    (tasksList: Task[], taskId: string, updater: (task: Task) => Task): Task[] => {
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
    },
    [],
  );

  const findTaskAndDelete = useCallback((tasksList: Task[], taskId: string): Task[] => {
    return tasksList
      .filter((task) => task.id !== taskId)
      .map((task) => {
        if (task.subtasks && task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: findTaskAndDelete(task.subtasks, taskId),
          };
        }
        return task;
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (editingTask) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        setTasks((prevTasks) =>
          updateTaskInTree(prevTasks, editingTask.id, (task) => ({
            ...task,
            name: editingTask.name,
          })),
        );
        debounceTimer.current = null;
      }, DEBOUNCE_DELAY);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editingTask, updateTaskInTree]);

  const handleAddTaskClick = () => {
    // Создаем новую задачу с длительностью 1 минута без модалки
    const newId = generateTaskId();
    setEditingTask({ id: newId, name: '' });

    const newTask: Task = {
      id: newId,
      name: '',
      duration: 60, // 1 минута
      status: 'to-do',
      subtasks: [],
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
    setSelectedDuration('1 минута');
    setEditingDurationTaskId(null);
    setParentTaskId(null);
  };

  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
  };

  const handleCreateDialogConfirm = () => {
    const durationSeconds = parseDuration(selectedDuration);
    if (durationDialogMode === 'edit' && editingDurationTaskId) {
      // Обновляем длительность существующей задачи
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, editingDurationTaskId, (task) => ({
          ...task,
          duration: durationSeconds,
        })),
      );
    } else if (parentTaskId) {
      // Создаем новую подзадачу
      const newSubtaskId = generateTaskId();
      const newSubtask: Task = {
        id: newSubtaskId,
        name: '',
        duration: durationSeconds,
        status: 'to-do',
        subtasks: [],
      };
      setTasks((prevTasks) => findTaskAndAddSubtask(prevTasks, parentTaskId, newSubtask));

      // Автоматически раскрываем задачу при добавлении подзадачи
      setExpandedTasks((prev) => new Set(prev).add(parentTaskId));

      // Устанавливаем новую подзадачу в режим редактирования
      setEditingTask({ id: newSubtaskId, name: '' });
    } else {
      // Создаем новую задачу
      const newId = generateTaskId();
      setEditingTask({ id: newId, name: '' });

      const newTask: Task = {
        id: newId,
        name: '',
        duration: durationSeconds,
        status: 'to-do',
        subtasks: [],
      };
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
    setIsCreateDialogOpen(false);
    setSelectedDuration('1 минута');
    setEditingDurationTaskId(null);
    setParentTaskId(null);
  };

  const handleSetDuration = (task: Task) => {
    if (task) {
      setSelectedDuration(formatDuration(task.duration));
      setDurationDialogMode('edit');
      setEditingDurationTaskId(task.id);
      setIsCreateDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleNameChange = (value: string) => {
    setEditingTask((prev) => (prev ? { ...prev, name: value } : null));
  };

  const handleNameFocus = (taskId: string) => {
    // Если уже редактируется другая задача, сохраняем её
    if (editingTask && editingTask.id !== taskId) {
      const previousTaskId = editingTask.id;
      const previousName = editingTask.name;
      // Отменяем debounce для предыдущей задачи
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // Сохраняем предыдущую задачу рекурсивно
      if (previousName) {
        setTasks((prevTasks) =>
          updateTaskInTree(prevTasks, previousTaskId, (task) => ({
            ...task,
            name: previousName,
          })),
        );
      }
    }
    // Инициализируем editingTask текущим значением задачи (рекурсивный поиск)
    const task = findTaskInTree(tasks, taskId);
    const initialName = task?.name ?? '';
    setEditingTask({ id: taskId, name: initialName });
  };

  const handleNameBlur = (taskId: string) => {
    // Обрабатываем blur только для редактируемой задачи
    if (editingTask?.id !== taskId) return;
    // Отменяем debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    // Сохраняем значение в задачу рекурсивно
    setTasks((prevTasks) =>
      updateTaskInTree(prevTasks, taskId, (task) => ({
        ...task,
        name: editingTask.name || 'Новая задача',
      })),
    );
    setEditingTask(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    const task = findTaskInTree(tasks, taskId);
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleImageUpload = async (taskId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const imageId = generateImageId();

      try {
        await saveImage(imageId, base64String);
        setTasks((prevTasks) =>
          updateTaskInTree(prevTasks, taskId, (task) => ({
            ...task,
            image: {
              imageId,
              status: 'ready',
            },
          })),
        );
      } catch (error) {
        console.error('Failed to save image to IndexedDB:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (taskId: string) => {
    const task = findTaskInTree(tasks, taskId);
    if (!task?.image?.imageId) return;

    try {
      // Удаляем из IndexedDB
      await deleteImage(task.image.imageId);
      // Удаляем из задачи
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, taskId, (t) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { image, ...rest } = t;
          return rest;
        }),
      );
    } catch (error) {
      console.error('Failed to delete image from IndexedDB:', error);
    }
    handleMenuClose();
  };

  const handleMenuItemClick = (action: string) => {
    if (!selectedTask) return;

    if (action === 'delete') {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      setTasks((prevTasks) => findTaskAndDelete(prevTasks, selectedTask.id));
      if (editingTask?.id === selectedTask.id) setEditingTask(null);
    } else if (action === 'upload-image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && selectedTask) {
          handleImageUpload(selectedTask.id, file);
        }
      };
      input.click();
    }

    handleMenuClose();
  };

  const findTaskAndAddSubtask = (tasksList: Task[], taskId: string, subtask: Task): Task[] => {
    return tasksList.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: [...(task.subtasks || []), subtask],
        };
      }
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: findTaskAndAddSubtask(task.subtasks, taskId, subtask),
        };
      }
      return task;
    });
  };

  const handleAddSubtask = (taskId: string) => {
    // Сохраняем текущую редактируемую задачу, если она есть
    if (editingTask) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // Сохраняем предыдущую задачу рекурсивно
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, editingTask.id, (task) => ({
          ...task,
          name: editingTask.name || 'Новая задача',
        })),
      );
    }

    const newSubtaskId = generateTaskId();
    const newSubtask: Task = {
      id: newSubtaskId,
      name: '',
      duration: 60, // 1 минута
      status: 'to-do',
      subtasks: [],
    };
    setTasks((prevTasks) => findTaskAndAddSubtask(prevTasks, taskId, newSubtask));

    // Автоматически раскрываем задачу при добавлении подзадачи
    setExpandedTasks((prev) => new Set(prev).add(taskId));

    // Устанавливаем новую подзадачу в режим редактирования
    setEditingTask({ id: newSubtaskId, name: '' });
    handleMenuClose();
  };

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

  const moveTaskInSiblings = (
    tasksList: Task[],
    taskId: string,
    direction: 'up' | 'down',
  ): Task[] => {
    // Check top level
    const topLevelIndex = tasksList.findIndex((t) => t.id === taskId);
    if (topLevelIndex !== -1) {
      if (direction === 'up' && topLevelIndex <= 0) return tasksList;
      if (direction === 'down' && topLevelIndex >= tasksList.length - 1) return tasksList;

      const newTasks = [...tasksList];
      const targetIndex = direction === 'up' ? topLevelIndex - 1 : topLevelIndex + 1;
      const temp = newTasks[topLevelIndex];
      newTasks[topLevelIndex] = newTasks[targetIndex];
      newTasks[targetIndex] = temp;
      return newTasks;
    }

    // Check in subtasks
    return tasksList.map((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskIndex = task.subtasks.findIndex((subtask) => subtask.id === taskId);
        if (subtaskIndex !== -1) {
          if (direction === 'up' && subtaskIndex <= 0) return task;
          if (direction === 'down' && subtaskIndex >= task.subtasks.length - 1) return task;

          const newSubtasks = [...task.subtasks];
          const targetIndex = direction === 'up' ? subtaskIndex - 1 : subtaskIndex + 1;
          const temp = newSubtasks[subtaskIndex];
          newSubtasks[subtaskIndex] = newSubtasks[targetIndex];
          newSubtasks[targetIndex] = temp;
          return {
            ...task,
            subtasks: newSubtasks,
          };
        }

        return {
          ...task,
          subtasks: moveTaskInSiblings(task.subtasks, taskId, direction),
        };
      }
      return task;
    });
  };

  const handleMoveTaskUp = () => {
    if (!selectedTask) return;

    setTasks((prevTasks) => moveTaskInSiblings(prevTasks, selectedTask.id, 'up'));

    handleMenuClose();
  };

  const handleMoveTaskDown = () => {
    if (!selectedTask) return;

    setTasks((prevTasks) => moveTaskInSiblings(prevTasks, selectedTask.id, 'down'));

    handleMenuClose();
  };

  const findParentTask = (
    tasksList: Task[],
    task: Task,
    parent: Task | null = null,
  ): Task | null => {
    for (const t of tasksList) {
      if (t.id === task.id) {
        return parent;
      }
      if (t.subtasks && t.subtasks.length > 0) {
        const found = findParentTask(t.subtasks, task, t);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  };

  const findSiblings = (tasksList: Task[], task: Task): Task[] => {
    // Ищем задачу на верхнем уровне
    const topLevelIndex = tasksList.findIndex((t) => t.id === task.id);
    if (topLevelIndex !== -1) {
      return tasksList;
    }

    // Ищем в подзадачах
    for (const t of tasksList) {
      if (t.subtasks && t.subtasks.length > 0) {
        const subtaskIndex = t.subtasks.findIndex((subtask) => subtask.id === task.id);
        if (subtaskIndex !== -1) {
          return t.subtasks;
        }
        const found = findSiblings(t.subtasks, task);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  };

  const canMoveTaskUp = (task: Task): boolean => {
    const siblings = findSiblings(tasks, task);
    if (siblings.length === 0) return false;
    const taskIndex = siblings.findIndex((t) => t.id === task.id);
    return taskIndex > 0;
  };

  const canMoveTaskDown = (task: Task): boolean => {
    const siblings = findSiblings(tasks, task);
    if (siblings.length === 0) return false;
    const taskIndex = siblings.findIndex((t) => t.id === task.id);
    return taskIndex >= 0 && taskIndex < siblings.length - 1;
  };

  const handleAIDecomposition = async (task: Task) => {
    const taskTitle = task.name;
    const parentTask = findParentTask(tasks, task);
    const parentTitle = parentTask?.name || null;
    const siblingsTitles =
      parentTask === null
        ? []
        : findSiblings(tasks, task)
            .filter((t) => t.id !== task.id)
            .map((t) => t.name)
            .filter((name) => name);

    const body = {
      task_title: taskTitle,
      parent_context: parentTitle,
      parent_id: null,
      level: 0,
      siblings: siblingsTitles,
    };

    try {
      const startResponse = await fetch('https://cloud.dab512.ru/tasker/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await startResponse.json();

      if (!data.success) {
        console.error(`Error at stage: ${data.stage}`, data.error);
        return;
      }

      // Добавляем подзадачи из ответа
      if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const newSubtasks: Task[] = data.subtasks.map((subtask: { title: string }) => ({
          id: generateTaskId(),
          name: subtask.title,
          duration: 60, // 1 минута по умолчанию
          status: 'to-do' as const,
          subtasks: [],
        }));

        setTasks((prevTasks) => {
          let updatedTasks = prevTasks;
          newSubtasks.forEach((subtask) => {
            updatedTasks = findTaskAndAddSubtask(updatedTasks, task.id, subtask);
          });
          return updatedTasks;
        });

        // Автоматически раскрываем задачу при добавлении подзадач
        setExpandedTasks((prev) => new Set(prev).add(task.id));

        // Сразу устанавливаем статус generating для всех подзадач (чтобы показать лоудер)
        setTasks((prevTasks) => {
          let updatedTasks = prevTasks;
          newSubtasks.forEach((subtask) => {
            const tempImageId = generateImageId();
            updatedTasks = updateTaskInTree(updatedTasks, subtask.id, (t) => ({
              ...t,
              image: {
                imageId: tempImageId,
                status: 'generating',
              },
            }));
          });
          return updatedTasks;
        });

        // Запускаем генерацию картинок последовательно с паузой между запросами
        setTimeout(async () => {
          for (let i = 0; i < newSubtasks.length; i++) {
            if (i > 0) {
              // Пауза между запросами (кроме первого)
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            handleAIGenerateImage(newSubtasks[i]).catch((error) => {
              console.error(`Failed to generate image for subtask ${newSubtasks[i].id}:`, error);
            });
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error during AI decomposition:', error);
    }
    handleMenuClose();
  };

  const pollImageStatus = async (operationId: string): Promise<string> => {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 секунд

      try {
        const checkResponse = await fetch('https://cloud.dab512.ru/tasker/api/generate_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check',
            operation_id: operationId,
          }),
        });

        const checkData = await checkResponse.json();

        if (checkData.status === 'ready') {
          return checkData.image;
        }

        if (checkData.status === 'error') {
          throw new Error('Image generation failed');
        }

        // status === 'generating' - продолжаем polling
      } catch (error) {
        console.error('[IMG] Error during status check:', error);
        throw error;
      }
    }
  };

  const handleAIGenerateImage = async (task: Task, retryCount = 0) => {
    const MAX_RETRIES = 3;

    // Закрываем меню сразу после нажатия
    if (retryCount === 0) {
      handleMenuClose();
      // Устанавливаем статус generating (временно используем пустой imageId)
      const tempImageId = generateImageId();
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, task.id, (t) => ({
          ...t,
          image: {
            imageId: tempImageId,
            status: 'generating',
          },
        })),
      );
    }

    try {
      // Шаг 1: Запуск генерации
      const startResponse = await fetch('https://cloud.dab512.ru/tasker/api/generate_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          prompt: task.name,
        }),
      });

      const startData = await startResponse.json();

      // Ошибка на этапе генерации описания
      if (!startData.success && startData.stage === 'description') {
        console.error('[IMG] YandexGPT failed after 3 attempts:', {
          stage: startData.stage,
          error: startData.error,
          retryCount: retryCount + 1,
        });
        throw new Error('Failed to generate image description');
      }

      // Ошибка на этапе запуска YandexArt
      if (!startData.success && startData.stage === 'image') {
        console.error('[IMG] YandexArt failed to start:', {
          stage: startData.stage,
          error: startData.error,
          retryCount: retryCount + 1,
        });
        throw new Error('Failed to start image generation');
      }

      // Общая ошибка валидации
      if (!startData.success) {
        console.error('[IMG] Start request failed:', {
          error: startData.error,
          retryCount: retryCount + 1,
        });
        throw new Error(startData.error || 'Failed to start image generation');
      }

      // Сохраняем описание для alt-атрибута
      const imageDescription = startData.image_description;
      const operationId = startData.operation_id;

      // Шаг 2: Polling статуса
      const image = await pollImageStatus(operationId);

      // Сохраняем изображение в IndexedDB
      const imageId = generateImageId();
      try {
        await saveImage(imageId, image);
        // Сохраняем imageId в задачу
        setTasks((prevTasks) =>
          updateTaskInTree(prevTasks, task.id, (t) => ({
            ...t,
            image: {
              imageId,
              status: 'ready',
              imageDescription,
            },
          })),
        );
      } catch (error) {
        console.error('Failed to save image to IndexedDB:', error);
        // Убираем image при ошибке сохранения
        setTasks((prevTasks) =>
          updateTaskInTree(prevTasks, task.id, (t) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { image, ...rest } = t;
            return rest;
          }),
        );
      }
    } catch (error) {
      // Retry логика
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`[IMG] Retry ${retryCount + 1}/${MAX_RETRIES}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return handleAIGenerateImage(task, retryCount + 1);
      }

      // Все попытки исчерпаны - убираем image
      console.error('[IMG] All retry attempts failed:', {
        taskId: task.id,
        taskTitle: task.name,
        retryCount: retryCount + 1,
        error: error instanceof Error ? error.message : String(error),
      });

      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, task.id, (t) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { image, ...rest } = t;
          return rest;
        }),
      );

      handleMenuClose();
    }
  };

  return (
    <>
      <meta name="title" content="Настройка расписания" />
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
          Настройка расписания
        </Typography>

        {tasks.length === 0 ? (
          <>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 4, maxWidth: 600, mx: 'auto' }}
            >
              Умное расписание помогает ребенку делать важные дела играючи
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 2, maxWidth: 600, mx: 'auto' }}
            >
              Добавляйте задачи в расписание и разбивайте сложные дела на простые задания, каждое из
              которые можно выполнить за одну минуту
            </Typography>
          </>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {tasks.map((task) => {
              const getEditingTaskName = (taskId: string): string | null => {
                return editingTask && editingTask.id === taskId ? editingTask.name : null;
              };

              return (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  name={task.name}
                  duration={task.duration}
                  image={task.image}
                  subtasks={task.subtasks}
                  editingTaskId={editingTask?.id ?? null}
                  getEditingTaskName={getEditingTaskName}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                  onNameChange={handleNameChange}
                  onNameFocus={handleNameFocus}
                  onNameBlur={handleNameBlur}
                  onMenuOpen={handleMenuOpen}
                  onAddSubtask={handleAddSubtask}
                  onImageUpload={handleImageUpload}
                />
              );
            })}
          </List>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl && selectedTask)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          {!selectedTask?.image && (
            <MenuItem onClick={() => handleMenuItemClick('upload-image')}>
              <ListItemIcon>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Загрузить картинку</ListItemText>
            </MenuItem>
          )}

          {!selectedTask?.image && (
            <MenuItem onClick={() => selectedTask && handleAIGenerateImage(selectedTask)}>
              <ListItemIcon>
                <AutoAwesomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>ИИ картинка</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => selectedTask && handleAddSubtask(selectedTask.id)}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Добавить подзадачу</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => selectedTask && handleAIDecomposition(selectedTask)}>
            <ListItemIcon>
              <ViewListIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>ИИ декомпозиция</ListItemText>
          </MenuItem>

          {selectedTask && (!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (
            <MenuItem onClick={() => handleSetDuration(selectedTask)}>
              <ListItemIcon>
                <AccessTimeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Поменять длительность</ListItemText>
            </MenuItem>
          )}

          {selectedTask && canMoveTaskUp(selectedTask) && (
            <MenuItem onClick={handleMoveTaskUp}>
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Подвинуть вверх</ListItemText>
            </MenuItem>
          )}

          {selectedTask && canMoveTaskDown(selectedTask) && (
            <MenuItem onClick={handleMoveTaskDown}>
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Подвинуть вниз</ListItemText>
            </MenuItem>
          )}

          {selectedTask?.image && (
            <MenuItem onClick={() => selectedTask && handleDeleteImage(selectedTask.id)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Удалить картинку</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => handleMenuItemClick('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Удалить задачу</ListItemText>
          </MenuItem>
        </Menu>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTaskClick}
          sx={{
            mt: 2,
            py: 1.5,
            textTransform: 'none',
            bgcolor: '#9c27b0',
            '&:hover': {
              bgcolor: '#7b1fa2',
            },
          }}
        >
          Добавить задачу
        </Button>

        <CreateTaskDialog
          open={isCreateDialogOpen}
          onClose={handleCreateDialogClose}
          onConfirm={handleCreateDialogConfirm}
          selectedDuration={selectedDuration}
          onDurationSelect={handleDurationSelect}
          mode={durationDialogMode}
        />
      </Box>
    </>
  );
}

export default Settings;
