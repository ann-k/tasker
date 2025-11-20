import { useCallback, useEffect, useRef, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
// import ViewListIcon from '@mui/icons-material/ViewList';
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
  return Date.now().toString();
};

function Settings() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTaskId(null);
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
    if (!selectedTaskId) return;

    if (action === 'delete') {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      setTasks((prevTasks) => findTaskAndDelete(prevTasks, selectedTaskId));
      if (editingTask?.id === selectedTaskId) setEditingTask(null);
    } else if (action === 'upload-image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && selectedTaskId) {
          handleImageUpload(selectedTaskId, file);
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
      duration: 60, // 1 минута в секундах
      status: 'to-do',
      subtasks: [],
    };
    setTasks((prevTasks) => findTaskAndAddSubtask(prevTasks, taskId, newSubtask));

    // Автоматически раскрываем задачу при добавлении подзадачи
    setExpandedTasks((prev) => new Set(prev).add(taskId));

    // Устанавливаем новую подзадачу в режим редактирования
    setEditingTask({ id: newSubtaskId, name: '' });
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
    if (!selectedTaskId) return;

    const taskIndex = tasks.findIndex((task) => task.id === selectedTaskId);
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
    if (!selectedTaskId) return;

    const taskIndex = tasks.findIndex((task) => task.id === selectedTaskId);
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
              const isEditingTask = Boolean(editingTask) && task.id === editingTask?.id;

              return (
                <>
                  <TaskItem
                    key={task.id}
                    id={task.id}
                    name={isEditingTask ? editingTask.name : task.name}
                    duration={task.duration}
                    image={task.image}
                    subtasks={task.subtasks}
                    editingTaskId={editingTask?.id ?? null}
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
                    open={Boolean(anchorEl)}
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

                    <MenuItem onClick={() => selectedTaskId && handleAddSubtask(selectedTaskId)}>
                      <ListItemIcon>
                        <AddIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Добавить подзадачу</ListItemText>
                    </MenuItem>

                    {/* <MenuItem onClick={() => handleMenuItemClick('ai-decomposition')}>
                      <ListItemIcon>
                        <ViewListIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>ИИ декомпозиция</ListItemText>
                    </MenuItem> */}

                    <Divider />

                    <MenuItem onClick={() => selectedTaskId && handleSetDuration(selectedTaskId)}>
                      <ListItemIcon>
                        <AccessTimeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Задать длительность</ListItemText>
                    </MenuItem>

                    <Divider />

                    {(() => {
                      const taskIndex = selectedTaskId
                        ? tasks.findIndex((task) => task.id === selectedTaskId)
                        : -1;
                      const isFirst = taskIndex === 0;
                      const isLast = taskIndex === tasks.length - 1;

                      return (
                        <>
                          {!isFirst && (
                            <MenuItem onClick={handleMoveTaskUp}>
                              <ListItemIcon>
                                <ArrowUpwardIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Подвинуть вверх</ListItemText>
                            </MenuItem>
                          )}

                          {!isLast && (
                            <MenuItem onClick={handleMoveTaskDown}>
                              <ListItemIcon>
                                <ArrowDownwardIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Подвинуть вниз</ListItemText>
                            </MenuItem>
                          )}
                        </>
                      );
                    })()}

                    <Divider />

                    <MenuItem onClick={() => handleMenuItemClick('delete')}>
                      <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Удалить задачу</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
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
