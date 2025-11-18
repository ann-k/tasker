import { useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import BrushIcon from '@mui/icons-material/Brush';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { Stack } from '@mui/system';

type Task = {
  id: string;
  name: string;
  duration: string;
  hasSubtasks: boolean;
};

const STORAGE_KEY = 'tasker-tasks';

function Settings() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: 'Новая задача',
      duration: '1 минута',
      hasSubtasks: false,
    };
    setTasks([...tasks, newTask]);
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
    if (action === 'delete') {
      setTasks(tasks.filter((task) => task.id !== selectedTaskId));
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
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                px: 1,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
              secondaryAction={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton edge="end" size="small" sx={{ color: 'text.secondary' }}>
                    <AddIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    edge="end"
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={(e) => handleMenuOpen(e, task.id)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              {task.hasSubtasks && (
                <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                  <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
              )}
              <ListItemIcon
                sx={{
                  minWidth: task.hasSubtasks ? 48 : 40,
                  mr: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BrushIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 400 }}>
                    {task.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {task.duration}
                  </Typography>
                }
              />
            </ListItem>
          ))}
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
