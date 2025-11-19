import { useEffect, useRef } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';

const TaskPlayScreen = ({
  task,
  open,
  onClose,
  onComplete,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onComplete: (taskId: string) => void;
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (!task) return null;

  return (
    <Dialog fullScreen open={open} onClose={onClose} aria-labelledby="task-play-title">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
        }}
      >
        <IconButton
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Закрыть"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
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
                alt={task.name || ''}
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
            {task.name}
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

          <IconButton
            onClick={() => {
              onComplete(task.id);
              onClose();
            }}
            aria-label="Завершить задачу"
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'success.main',
              color: 'success.contrastText',
              mt: 4,
              '&:hover': {
                bgcolor: 'success.dark',
              },
            }}
          >
            <CheckIcon sx={{ fontSize: 60 }} />
          </IconButton>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TaskPlayScreen;
