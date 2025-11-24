import { useEffect, useRef, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { Box, Dialog, IconButton, LinearProgress, Typography } from '@mui/material';

import { useImageUrl } from '@/hooks/useImageUrl';

import { type Task } from '../Settings/TaskItem';
import { formatDurationReadable, formatDurationWithSeconds } from '../Settings/duration';

const TaskPlayScreen = ({
  task,
  open,
  onClose,
  onMarkComplete,
  onMoveToNext,
  onMoveToPrevious,
  canGoBack,
  showNextButton = true,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onMarkComplete: (taskId: string, actualTime: number) => void;
  onMoveToNext: () => void;
  onMoveToPrevious: () => void;
  canGoBack: boolean;
  showNextButton?: boolean;
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [passedSeconds, setPassedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedTimeRef = useRef<number | null>(null);
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

  const prevTaskIdRef = useRef<string | null>(null);

  // Сбрасываем состояние при изменении ID задачи
  useEffect(() => {
    if (open && task) {
      const isNewTask = prevTaskIdRef.current !== task.id;
      if (isNewTask) {
        setPassedSeconds(0);
        setIsPaused(false);
        completedTimeRef.current = null;
        prevTaskIdRef.current = task.id;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  // Сбрасываем при закрытии диалога
  useEffect(() => {
    if (!open) {
      prevTaskIdRef.current = null;
    }
  }, [open]);

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

  const displayImage = Boolean(task.image && task.image.status === 'ready' && imageUrl);

  return (
    <Dialog fullScreen open={open} onClose={onClose} aria-labelledby="task-play-title" autoFocus>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
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
              display: 'grid',
              gridTemplateRows: `${displayImage ? 'minmax(100px, max-content) ' : ''}max-content max-content max-content`,
              alignItems: 'end',
              justifyContent: 'center',
              justifyItems: 'center',
              maxHeight: '100vh',
              p: 4,
              gap: 3,
            }}
          >
            {displayImage && (
              <Box
                sx={{
                  maxWidth: '500px',
                  maxHeight: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 3,
                  display: 'grid',
                  aspectRatio: '1344/832',
                }}
              >
                <img
                  src={imageUrl || ''}
                  alt={task.image?.imageDescription || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                  }}
                />
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {task.status === 'done' && (
                <CheckIcon
                  aria-label="Выполнено"
                  sx={{
                    fontSize: 32,
                    color: 'success.main',
                  }}
                />
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
            </Box>

            {task.status === 'done' ? (
              <Typography
                variant="h6"
                component="p"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                Выполнено за{' '}
                {formatDurationReadable(Math.max(1, completedTimeRef.current || passedSeconds))}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '600px',
                  px: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography
                    variant="body1"
                    component="p"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.95rem',
                    }}
                  >
                    Прошло {formatDurationWithSeconds(passedSeconds)}
                  </Typography>

                  <Typography
                    variant="body1"
                    component="p"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.95rem',
                    }}
                  >
                    Осталось {formatDurationWithSeconds(remainingSeconds)}
                  </Typography>
                </Box>

                <Box sx={{ position: 'relative', width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, (passedSeconds / task.duration) * 100))}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${Math.min(100, Math.max(0, (passedSeconds / task.duration) * 100))}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: 'primary.dark',
                      border: '2px solid',
                      borderColor: 'background.paper',
                      zIndex: 1,
                      transition: 'left 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                justifyContent: 'center',
                mt: 2,
                minHeight: 120,
              }}
            >
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

              {isPaused && (
                <IconButton
                  onClick={() => setIsPaused(false)}
                  aria-label="Возобновить таймер"
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
                  <PlayArrowIcon sx={{ fontSize: 32 }} />
                </IconButton>
              )}

              {task.status !== 'done' && !isPaused && (
                <IconButton
                  onClick={() => setIsPaused(true)}
                  aria-label="Поставить таймер на паузу"
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
                  <PauseIcon sx={{ fontSize: 32 }} />
                </IconButton>
              )}

              {task.status !== 'done' && (
                <IconButton
                  onClick={() => {
                    completedTimeRef.current = passedSeconds;
                    onMarkComplete(task.id, passedSeconds);
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
              )}

              {showNextButton && (
                <IconButton
                  onClick={() => {
                    onMoveToNext();
                  }}
                  aria-label={'Перейти к следующей задаче'}
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  <SkipNextIcon sx={{ fontSize: 60 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default TaskPlayScreen;
