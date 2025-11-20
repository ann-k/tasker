import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  Button,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

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
    setSelectedDuration('1 минута');
    setDurationDialogMode('create');
    setEditingDurationTaskId(null);
    setIsCreateDialogOpen(true);
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

  const handleSetDuration = (taskId: string) => {
    const task = findTaskInTree(tasks, taskId);
    if (task) {
      setSelectedDuration(formatDuration(task.duration));
      setDurationDialogMode('edit');
      setEditingDurationTaskId(taskId);
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

  const handleImageUpload = (taskId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, taskId, (task) => ({
          ...task,
          image: base64String,
        })),
      );
    };
    reader.readAsDataURL(file);
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

    // Открываем диалог для выбора длительности подзадачи
    setSelectedDuration('1 минута');
    setDurationDialogMode('create');
    setEditingDurationTaskId(null);
    setParentTaskId(taskId);
    setIsCreateDialogOpen(true);
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

  const handleMoveTaskUp = () => {
    if (!selectedTask) return;

    const taskIndex = tasks.findIndex((task) => task.id === selectedTask.id);
    if (taskIndex <= 0) {
      handleMenuClose();
      return;
    }

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const temp = newTasks[taskIndex];
      newTasks[taskIndex] = newTasks[taskIndex - 1];
      newTasks[taskIndex - 1] = temp;
      return newTasks;
    });

    handleMenuClose();
  };

  const handleMoveTaskDown = () => {
    if (!selectedTask) return;

    const taskIndex = tasks.findIndex((task) => task.id === selectedTask.id);
    if (taskIndex < 0 || taskIndex >= tasks.length - 1) {
      handleMenuClose();
      return;
    }

    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const temp = newTasks[taskIndex];
      newTasks[taskIndex] = newTasks[taskIndex + 1];
      newTasks[taskIndex + 1] = temp;
      return newTasks;
    });

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

    console.log(body);

    try {
      const startResponse = await fetch('https://cloud.dab512.ru/tasker/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await startResponse.json();
      console.log(data);

      if (!data.success) {
        console.error(`Error at stage: ${data.stage}`, data.error);
        return;
      }

      handleMenuClose();

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
      }
    } catch (error) {
      console.error('Error during AI decomposition:', error);
    }

    handleMenuClose();
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
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Нет задач
          </Typography>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {tasks.map((task) => {
              const getEditingTaskName = (taskId: string): string | null => {
                return editingTask && editingTask.id === taskId ? editingTask.name : null;
              };

              return (
                <Fragment key={task.id}>
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
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl && selectedTask)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={() => handleMenuItemClick('upload-image')}>
                      <ListItemIcon>
                        <ImageIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Загрузить картинку</ListItemText>
                    </MenuItem>

                    {/* <MenuItem onClick={() => handleMenuItemClick('ai-image')}>
                      <ListItemIcon>
                        <AutoAwesomeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>ИИ картинка</ListItemText>
                    </MenuItem> */}

                    <Divider />

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

                    <Divider />

                    <MenuItem onClick={() => selectedTask && handleSetDuration(selectedTask.id)}>
                      <ListItemIcon>
                        <AccessTimeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Задать длительность</ListItemText>
                    </MenuItem>

                    <Divider />

                    {selectedTask &&
                      tasks.findIndex((task) => task.id === selectedTask.id) !== 0 && (
                        <MenuItem onClick={handleMoveTaskUp}>
                          <ListItemIcon>
                            <ArrowUpwardIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Подвинуть вверх</ListItemText>
                        </MenuItem>
                      )}

                    {selectedTask &&
                      tasks.findIndex((task) => task.id === selectedTask.id) !==
                        tasks.length - 1 && (
                        <MenuItem onClick={handleMoveTaskDown}>
                          <ListItemIcon>
                            <ArrowDownwardIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Подвинуть вниз</ListItemText>
                        </MenuItem>
                      )}

                    <Divider />

                    <MenuItem onClick={() => handleMenuItemClick('delete')}>
                      <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Удалить задачу</ListItemText>
                    </MenuItem>
                  </Menu>
                </Fragment>
              );
            })}
          </List>
        )}

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
