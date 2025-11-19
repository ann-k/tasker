import { useEffect, useRef } from 'react';

import AddIcon from '@mui/icons-material/Add';
import BrushIcon from '@mui/icons-material/Brush';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { Stack } from '@mui/system';

import { formatDuration } from './duration';

export type Task = {
  id: string;
  name: string;
  duration: number; // длительность в секундах
  status: 'to-do' | 'doing' | 'done';
  image?: string;
  subtasks?: Task[];
};

const TaskItem = ({
  id,
  name,
  duration,
  image,
  subtasks,
  editingTaskId,
  expandedTasks,
  onToggleExpand,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onMenuOpen,
  onAddSubtask,
  onImageUpload,
  level = 0,
}: {
  id: string;
  name: string;
  duration: number;
  image?: string;
  subtasks?: Task[];
  editingTaskId?: string | null;
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  onNameChange: (value: string) => void;
  onNameFocus: (taskId: string) => void;
  onNameBlur: (taskId: string) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onImageUpload: (taskId: string, file: File) => void;
  level?: number;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasSubtasks = Boolean(subtasks && subtasks.length > 0);
  const isEditing = editingTaskId === id;
  const isExpanded = expandedTasks.has(id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Небольшая задержка для гарантии, что элемент уже в DOM
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditing, inputRef]);

  const handleChevronClick = () => {
    onNameBlur(id);
    onToggleExpand(id);
  };

  const handleAddSubtaskClick = () => {
    onAddSubtask(id);
  };

  return (
    <>
      <ListItem
        sx={{
          px: 1,
          py: 1.5,
          pl: level > 0 ? level * 2 + 1 + (hasSubtasks ? 0 : 5) : 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
        secondaryAction={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              edge="end"
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={handleAddSubtaskClick}
              aria-label="Добавить подзадачу"
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <IconButton
              edge="end"
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={(e) => onMenuOpen(e, id)}
              aria-label="Ещё"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {hasSubtasks && (
          <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
            <IconButton
              size="small"
              onClick={handleChevronClick}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Свернуть подзадачи' : 'Раскрыть подзадачи'}
              sx={{
                color: 'text.secondary',
                padding: 0.5,
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </ListItemIcon>
        )}
        <ListItemIcon
          sx={{
            minWidth: hasSubtasks ? 48 : image ? 88 : 40,
            mr: 1.5,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {image && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                aria-hidden="true"
              />
            </Box>
          )}
          <IconButton
            size="small"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.light',
              flexShrink: 0,
              '&:hover': {
                bgcolor: 'primary.main',
                '& .MuiSvgIcon-root': {
                  color: 'primary.contrastText',
                },
              },
              '&:focus-visible': {
                outline: '3px solid #1976d2 !important',
                outlineOffset: '2px !important',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.3) !important',
              },
            }}
            aria-label={image ? 'Изменить изображение' : 'Загрузить изображение'}
          >
            <BrushIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageUpload(id, file);
              }
            }}
            style={{
              display: 'none',
            }}
          />
        </ListItemIcon>

        <ListItemText
          primary={
            <TextField
              inputRef={inputRef}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onFocus={() => onNameFocus(id)}
              onBlur={() => onNameBlur(id)}
              variant="standard"
              placeholder="Введите название задачи"
              fullWidth
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  fontWeight: 400,
                  color: 'text.primary',
                  '&:before, &:after': {
                    borderBottom: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: 0,
                  '&::placeholder': {
                    opacity: 0.5,
                  },
                },
              }}
            />
          }
          secondary={
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {formatDuration(duration)}
            </Typography>
          }
        />
      </ListItem>

      {hasSubtasks && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List sx={{ p: 0 }}>
            {subtasks?.map((subtask) => (
              <TaskItem
                key={subtask.id}
                id={subtask.id}
                name={subtask.name}
                duration={subtask.duration}
                image={subtask.image}
                subtasks={subtask.subtasks}
                editingTaskId={editingTaskId}
                expandedTasks={expandedTasks}
                onToggleExpand={onToggleExpand}
                onNameChange={onNameChange}
                onNameFocus={onNameFocus}
                onNameBlur={onNameBlur}
                onMenuOpen={onMenuOpen}
                onAddSubtask={onAddSubtask}
                onImageUpload={onImageUpload}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default TaskItem;
