import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';

import { type Accomplishment } from './types';

const AccomplishmentItem = ({
  accomplishment,
  completed,
}: {
  accomplishment: Accomplishment;
  completed: boolean;
}) => {
  return (
    <Card
      role="group"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        opacity: completed ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <CardMedia
        component="img"
        image={accomplishment.image}
        alt=""
        sx={{
          height: 200,
          objectFit: 'cover',
        }}
      />
      <CardContent sx={{ flexGrow: 1, position: 'relative', pb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 500, flex: 1, pr: 1 }}>
            {accomplishment.title}
          </Typography>
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {completed ? (
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {accomplishment.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AccomplishmentItem;
