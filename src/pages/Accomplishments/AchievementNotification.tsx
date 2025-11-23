import { useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';

import Fireworks from '../../components/Fireworks';
import { type Accomplishment } from './types';

const AchievementNotification = ({
  achievements,
  open,
  onClose,
}: {
  achievements: Accomplishment[];
  open: boolean;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [fireworksCompleted, setFireworksCompleted] = useState(false);

  // Показываем фейерверки при открытии нового достижения
  useEffect(() => {
    if (open && achievements.length > 0) {
      setShowFireworks(true);
      setFireworksCompleted(false);
    }
  }, [open, achievements.length, currentIndex]);

  // Сбрасываем индекс при изменении списка достижений
  useEffect(() => {
    if (achievements.length > 0 && currentIndex >= achievements.length) {
      setCurrentIndex(0);
    }
  }, [achievements.length, currentIndex]);

  if (achievements.length === 0) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];
  const isLast = currentIndex === achievements.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setCurrentIndex(0);
      setShowFireworks(false);
      setFireworksCompleted(false);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setShowFireworks(true);
      setFireworksCompleted(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCurrentIndex(0);
    setShowFireworks(false);
    setFireworksCompleted(false);
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      aria-labelledby="achievement-notification-title"
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: 'background.default',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Fireworks
          key={currentAchievement.id}
          active={showFireworks}
          onComplete={() => {
            setShowFireworks(false);
            setFireworksCompleted(true);
          }}
        />
        <IconButton
          onClick={handleClose}
          aria-label="Закрыть"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
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
            gap: 4,
            position: 'relative',
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={currentAchievement.image}
              alt=""
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
                border: '8px solid',
                borderColor: '#ba68c8',
              }}
            />
          </Box>

          <Typography
            id="achievement-notification-title"
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              color: 'text.primary',
              mb: 2,
            }}
          >
            {currentAchievement.title}
          </Typography>

          <Typography
            variant="h6"
            component="p"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              maxWidth: 500,
            }}
          >
            {currentAchievement.description}
          </Typography>

          {achievements.length > 1 && (
            <Typography
              variant="body2"
              component="p"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mt: 2,
              }}
            >
              Достижение {currentIndex + 1} из {achievements.length}
            </Typography>
          )}

          <Box sx={{ mt: 4, minHeight: 48 }}>
            {fireworksCompleted && (
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Далее
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AchievementNotification;
