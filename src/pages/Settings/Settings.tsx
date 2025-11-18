import { useEffect, useRef, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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

import TaskItem, { type Task } from './TaskItem';

const STORAGE_KEY = 'tasker-tasks';
const DEBOUNCE_DELAY = 500;

const generateTaskId = (): string => {
  return Date.now().toString();
};

function Settings() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [editingTask, setEditingTask] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (editingTask) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        setTasks((prevTasks) => {
          return prevTasks.map((t) => {
            if (t.id === editingTask.id) {
              const newTask = { ...t, name: editingTask.name };
              return newTask;
            }
            return t;
          });
        });
        debounceTimer.current = null;
      }, DEBOUNCE_DELAY);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editingTask]);

  const handleAddTask = () => {
    const newId = generateTaskId();
    setEditingTask({ id: newId, name: '' });

    const newTask: Task = {
      id: newId,
      name: '',
      duration: '1 минута',
      subtasks: [],
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
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
      // Сохраняем предыдущую задачу
      if (previousName) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === previousTaskId ? { ...task, name: previousName } : task,
          ),
        );
      }
    }
    // Инициализируем editingTask текущим значением задачи
    const task = tasks.find((t) => t.id === taskId);
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
    // Сохраняем значение в задачу
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, name: editingTask.name || 'Новая задача' } : task,
      ),
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

  const findTaskAndDelete = (tasksList: Task[], taskId: string): Task[] => {
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
  };

  const handleMenuItemClick = (action: string) => {
    if (action === 'delete' && selectedTaskId) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      setTasks((prevTasks) => findTaskAndDelete(prevTasks, selectedTaskId));
      if (editingTask?.id === selectedTaskId) setEditingTask(null);
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
    const newSubtask: Task = {
      id: generateTaskId(),
      name: '',
      duration: '1 минута',
      subtasks: [],
    };
    setTasks((prevTasks) => findTaskAndAddSubtask(prevTasks, taskId, newSubtask));
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
          variant="h5"
          sx={{
            fontWeight: 500,
            mb: 2,
            color: 'text.primary',
            lineHeight: 1.2,
          }}
        >
          Настройка расписания
        </Typography>

        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {tasks.map((task) => {
            const isEditingTask = Boolean(editingTask) && task.id === editingTask?.id;

            return (
              <TaskItem
                key={task.id}
                id={task.id}
                name={isEditingTask ? editingTask.name : task.name}
                duration={task.duration}
                subtasks={task.subtasks}
                isEditing={isEditingTask}
                onNameChange={handleNameChange}
                onNameFocus={handleNameFocus}
                onNameBlur={handleNameBlur}
                onMenuOpen={handleMenuOpen}
                onAddSubtask={handleAddSubtask}
              />
            );
          })}
        </List>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTask}
          sx={{
            mt: 2,
            py: 1.5,
            textTransform: 'none',
          }}
        >
          Добавить задачу
        </Button>

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

          <MenuItem onClick={() => handleMenuItemClick('ai-image')}>
            <ListItemIcon>
              <AutoAwesomeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>ИИ картинка</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => handleMenuItemClick('add-subtask')}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Добавить подзадачу</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleMenuItemClick('ai-decomposition')}>
            <ListItemIcon>
              <ViewListIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>ИИ декомпозиция</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => handleMenuItemClick('set-duration')}>
            <ListItemIcon>
              <AccessTimeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Задать длительность</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => handleMenuItemClick('navigate')}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <ArrowDownwardIcon fontSize="small" />
              <ArrowUpwardIcon fontSize="small" />
              <ChevronLeftIcon fontSize="small" />
              <ChevronRightIcon fontSize="small" />
            </Box>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => handleMenuItemClick('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Удалить задачу</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
}

export default Settings;
