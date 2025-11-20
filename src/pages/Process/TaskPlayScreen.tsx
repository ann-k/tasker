import { useEffect, useRef, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Dialog, IconButton, Typography } from '@mui/material';

import { type Task } from '../Settings/TaskItem';
import { formatDurationWithSeconds } from '../Settings/duration';

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
  const [passedSeconds, setPassedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && task) {
      setPassedSeconds(0);
      setIsPaused(false);
    }
  }, [open, task]);

  useEffect(() => {
    if (open && task && !isPaused) {
      intervalRef.current = setInterval(() => {
        setPassedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, task, isPaused]);

  if (!task) return null;

  const remainingSeconds = Math.max(0, task.duration - passedSeconds);

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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Typography
              variant="h6"
              component="p"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              Прошло: {formatDurationWithSeconds(passedSeconds)}
            </Typography>

            <Typography
              variant="h6"
              component="p"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              Осталось: {formatDurationWithSeconds(remainingSeconds)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 2 }}>
            <IconButton
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? 'Возобновить таймер' : 'Поставить таймер на паузу'}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {isPaused ? (
                <PlayArrowIcon sx={{ fontSize: 32 }} />
              ) : (
                <PauseIcon sx={{ fontSize: 32 }} />
              )}
            </IconButton>

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
                '&:hover': {
                  bgcolor: 'success.dark',
                },
              }}
            >
              <CheckIcon sx={{ fontSize: 60 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TaskPlayScreen;
