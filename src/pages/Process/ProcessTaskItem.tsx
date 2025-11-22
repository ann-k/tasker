import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Stack } from '@mui/system';

import { useImageUrl } from '@/hooks/useImageUrl';

import { type Task } from '../Settings/TaskItem';
import { calculateSubtasksDuration, formatDuration } from '../Settings/duration';

const ProcessTaskItem = ({
  id,
  name,
  duration,
  image,
  status,
  subtasks,
  expandedTasks,
  onToggleExpand,
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
  status: 'to-do' | 'doing' | 'done';
  subtasks?: Task[];
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  level?: number;
}) => {
  const hasSubtasks = Boolean(subtasks && subtasks.length > 0);
  const isExpanded = expandedTasks.has(id);
  const isCompleted = status === 'done';
  const displayDuration = hasSubtasks ? calculateSubtasksDuration(subtasks) : duration;
  const imageUrl = useImageUrl(image?.status === 'ready' ? image.imageId : undefined);

  const handleChevronClick = () => {
    onToggleExpand(id);
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
          opacity: isCompleted ? 0.6 : 1,
          flexDirection: 'column',
          maxWidth: 500,
          mx: 'auto',
          width: '100%',
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
      >
        {image && image.status === 'ready' && imageUrl && (
          <Box
            sx={{
              width: '100%',
              maxHeight: 300,
              mb: 1,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
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
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 400,
                  color: 'text.primary',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}
              >
                {name || 'Новая задача'}
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}
              >
                {formatDuration(displayDuration)}
              </Typography>
            }
          />

          {isCompleted && (
            <Box
              component="span"
              role="img"
              aria-label="Выполнено"
              sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
            >
              <CheckCircleIcon aria-hidden="true" sx={{ color: 'success.main', fontSize: 24 }} />
            </Box>
          )}
        </Stack>
      </ListItem>

      {hasSubtasks && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List sx={{ p: 0 }}>
            {subtasks?.map((subtask) => (
              <ProcessTaskItem
                key={subtask.id}
                id={subtask.id}
                name={subtask.name}
                duration={subtask.duration}
                image={subtask.image}
                status={subtask.status}
                subtasks={subtask.subtasks}
                expandedTasks={expandedTasks}
                onToggleExpand={onToggleExpand}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default ProcessTaskItem;
