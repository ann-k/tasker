import { useEffect, useRef } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';

const TaskPlayScreen = ({
  task,
  open,
  onClose,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (!task) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      aria-labelledby="task-play-title"
      aria-modal="true"
      role="dialog"
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        <IconButton
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Закрыть экран задачи"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
            '&:focus-visible': {
              outline: '3px solid #1976d2 !important',
              outlineOffset: '2px !important',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            p: 4,
            gap: 3,
          }}
        >
          {task.image && (
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 300,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 3,
              }}
            >
              <img
                src={task.image}
                alt={task.name || 'Изображение задачи'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          <Typography
            id="task-play-title"
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 500,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            {task.name || 'Новая задача'}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            {task.duration}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TaskPlayScreen;
