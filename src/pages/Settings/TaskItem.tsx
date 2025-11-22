import { useEffect, useRef } from 'react';

import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  CircularProgress,
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

import { useImageUrl } from '@/hooks/useImageUrl';

import { calculateSubtasksDuration, formatDuration } from './duration';

export type Task = {
  id: string;
  name: string;
  duration: number; // длительность в секундах
  status: 'to-do' | 'doing' | 'done';
  image?: {
    imageId: string; // ID изображения в IndexedDB
    status: 'generating' | 'ready';
    imageDescription?: string;
  };
  subtasks?: Task[];
};

const TaskItem = ({
  id,
  name,
  duration,
  image,
  subtasks,
  editingTaskId,
  getEditingTaskName,
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
  image?: {
    imageId: string; // ID изображения в IndexedDB
    status: 'generating' | 'ready';
    imageDescription?: string;
  };
  subtasks?: Task[];
  editingTaskId?: string | null;
  getEditingTaskName: (taskId: string) => string | null;
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
  const hasSubtasks = Boolean(subtasks && subtasks.length > 0);
  const isEditing = editingTaskId === id;
  const isExpanded = expandedTasks.has(id);
  const editingTaskName = getEditingTaskName(id);
  const displayName = isEditing && editingTaskName !== null ? editingTaskName : name;
  const displayDuration = hasSubtasks ? calculateSubtasksDuration(subtasks) : duration;
  const imageUrl = useImageUrl(image?.status === 'ready' ? image.imageId : undefined);

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
          flexDirection: 'column',
          maxWidth: 500,
          mx: 'auto',
          width: '100%',
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
      >
        {image && (
          <Box
            sx={{
              width: '100%',
              maxHeight: 300,
              mb: 1,
              borderRadius: 1,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: image.status === 'generating' ? 'action.hover' : 'transparent',
            }}
            role={image.status === 'generating' ? 'status' : undefined}
            aria-busy={image.status === 'generating' ? true : undefined}
          >
            {image.status === 'generating' ? (
              <CircularProgress size={24} aria-label="Генерируем картинку" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={image.imageDescription || ''}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain',
                }}
              />
            ) : null}
          </Box>
        )}

        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
          {hasSubtasks && (
            <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
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

          <ListItemText
            sx={{ flex: 1 }}
            primary={
              <TextField
                inputRef={inputRef}
                value={displayName}
                onChange={(e) => onNameChange(e.target.value)}
                onFocus={() => onNameFocus(id)}
                onBlur={() => onNameBlur(id)}
                placeholder="Введите название задачи"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    width: 'calc(100% - 64px - 20px)',
                    fontSize: '1rem',
                    fontWeight: 400,
                    color: 'text.primary',
                    '&:before, &:after': {
                      borderBottom: 'none',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '10px',
                    '&::placeholder': {
                      // opacity: 0.5,
                    },
                  },
                }}
              />
            }
            secondary={
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {formatDuration(displayDuration)}
              </Typography>
            }
          />

          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={handleAddSubtaskClick}
              aria-label="Добавить подзадачу"
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              sx={{ color: 'text.secondary' }}
              onClick={(e) => onMenuOpen(e, id)}
              aria-label="Ещё"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
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
                getEditingTaskName={getEditingTaskName}
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
