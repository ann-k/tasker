import { useEffect, useRef, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { Box, Dialog, IconButton, Typography } from '@mui/material';

import { useImageUrl } from '@/hooks/useImageUrl';

import Fireworks from '../../components/Fireworks';
import { type Task } from '../Settings/TaskItem';
import { formatDurationWithSeconds } from '../Settings/duration';

const TaskPlayScreen = ({
  task,
  open,
  onClose,
  onMarkComplete,
  onMoveToNext,
  onMoveToPrevious,
  canGoBack,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onMarkComplete: (taskId: string) => void;
  onMoveToNext: () => void;
  onMoveToPrevious: () => void;
  canGoBack: boolean;
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [passedSeconds, setPassedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageUrl = useImageUrl(task?.image?.status === 'ready' ? task.image.imageId : undefined);

  useEffect(() => {
    if (open) {
      // Устанавливаем фокус на Paper элемент Dialog с задержкой,
      // чтобы Dialog успел отрендериться
      const timeoutId = setTimeout(() => {
        // Ищем Paper элемент Dialog (он имеет класс MuiDialog-paper)
        const paperElement = document.querySelector('[role="dialog"]') as HTMLElement;
        if (paperElement) {
          paperElement.setAttribute('tabindex', '-1');
          paperElement.focus();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  useEffect(() => {
    if (open && task) {
      setPassedSeconds(0);
      setIsPaused(false);
    }
  }, [open, task]);

  useEffect(() => {
    if (open && task && !isPaused && task.status !== 'done') {
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
    <Dialog fullScreen open={open} onClose={onClose} aria-labelledby="task-play-title" autoFocus>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Fireworks active={showFireworks} onComplete={() => setShowFireworks(false)} />
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
          {task.image && task.image.status === 'ready' && imageUrl && (
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
                src={imageUrl}
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
            {canGoBack && (
              <IconButton
                onClick={onMoveToPrevious}
                aria-label="Вернуться к предыдущей задаче"
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
                <SkipPreviousIcon sx={{ fontSize: 32 }} />
              </IconButton>
            )}

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
                if (task.status === 'done') {
                  // Если задача уже завершена, переходим к следующей
                  onMoveToNext();
                  onClose();
                } else {
                  // Если задача еще не завершена, помечаем как завершенную
                  setShowFireworks(true);
                  onMarkComplete(task.id);
                }
              }}
              aria-label={
                task.status === 'done' ? 'Перейти к следующей задаче' : 'Завершить задачу'
              }
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: task.status === 'done' ? 'primary.main' : 'success.main',
                color: task.status === 'done' ? 'primary.contrastText' : 'success.contrastText',
                '&:hover': {
                  bgcolor: task.status === 'done' ? 'primary.dark' : 'success.dark',
                },
              }}
            >
              {task.status === 'done' ? (
                <SkipNextIcon sx={{ fontSize: 60 }} />
              ) : (
                <CheckIcon sx={{ fontSize: 60 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TaskPlayScreen;
