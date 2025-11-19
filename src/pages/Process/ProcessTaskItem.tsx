import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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

import { type Task } from '../Settings/TaskItem';

const ProcessTaskItem = ({
  id,
  name,
  duration,
  image,
  status,
  subtasks,
  expandedTasks,
  onToggleExpand,
  onPlay,
  level = 0,
}: {
  id: string;
  name: string;
  duration: string;
  image?: string;
  status: 'to-do' | 'doing' | 'done';
  subtasks?: Task[];
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  onPlay: (task: Task) => void;
  level?: number;
}) => {
  const hasSubtasks = Boolean(subtasks && subtasks.length > 0);
  const isExpanded = expandedTasks.has(id);
  const isCompleted = status === 'done';

  const handleChevronClick = () => {
    onToggleExpand(id);
  };

  const handlePlayClick = () => {
    onPlay({
      id,
      name,
      duration,
      status,
      image,
      subtasks,
    });
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
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
        secondaryAction={
          isCompleted ? (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
          ) : (
            <IconButton
              edge="end"
              size="small"
              onClick={handlePlayClick}
              aria-label={`Запустить задачу: ${name}`}
              sx={{ color: 'primary.main' }}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          )
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
        </ListItemIcon>

        <ListItemText
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
              {duration}
            </Typography>
          }
        />
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
                onPlay={onPlay}
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
