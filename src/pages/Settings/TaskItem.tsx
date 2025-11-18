import { useEffect, useRef } from 'react';

import AddIcon from '@mui/icons-material/Add';
import BrushIcon from '@mui/icons-material/Brush';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { Stack } from '@mui/system';

export type Task = {
  id: string;
  name: string;
  duration: string;
  hasSubtasks: boolean;
};

const TaskItem = ({
  id,
  name,
  duration,
  hasSubtasks,
  isEditing,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onMenuOpen,
}: {
  id: string;
  name: string;
  duration: string;
  hasSubtasks: boolean;
  isEditing: boolean;
  onNameChange: (value: string) => void;
  onNameFocus: (taskId: string) => void;
  onNameBlur: (taskId: string) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, taskId: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, inputRef]);

  return (
    <ListItem
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
            onClick={(e) => onMenuOpen(e, id)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      }
    >
      {hasSubtasks && (
        <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
          <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </ListItemIcon>
      )}
      <ListItemIcon
        sx={{
          minWidth: hasSubtasks ? 48 : 40,
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
            {duration}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default TaskItem;
