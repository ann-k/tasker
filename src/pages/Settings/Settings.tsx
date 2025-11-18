import { useEffect, useRef, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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

import TaskItem, { type Task } from './TaskItem';

const STORAGE_KEY = 'tasker-tasks';
const DEBOUNCE_DELAY = 500;

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
    console.log(editingTask);
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
    const newId = Date.now().toString();
    setEditingTask({ id: newId, name: '' });

    const newTask: Task = {
      id: newId,
      name: '',
      duration: '1 минута',
      hasSubtasks: false,
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

  const handleMenuItemClick = (action: string) => {
    if (action === 'delete' && selectedTaskId) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== selectedTaskId));
      if (editingTask?.id === selectedTaskId) setEditingTask(null);
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
                hasSubtasks={task.hasSubtasks}
                isEditing={isEditingTask}
                onNameChange={handleNameChange}
                onNameFocus={handleNameFocus}
                onNameBlur={handleNameBlur}
                onMenuOpen={handleMenuOpen}
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
          <MenuItem onClick={() => handleMenuItemClick('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Удалить</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
}

export default Settings;
