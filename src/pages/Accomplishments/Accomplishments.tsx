import { useState } from 'react';

import { Box, Grid2, Typography } from '@mui/material';

import AccomplishmentItem from './AccomplishmentItem';
import { ACCOMPLISHMENTS } from './constants';
import { type AccomplishmentStatuses } from './types';
import { loadAccomplishmentStatuses } from './utils';

function Accomplishments() {
  const [statuses] = useState<AccomplishmentStatuses>(() => loadAccomplishmentStatuses());

  const completedAccomplishments = ACCOMPLISHMENTS.filter((acc) => statuses[acc.id] === true);
  const pendingAccomplishments = ACCOMPLISHMENTS.filter((acc) => statuses[acc.id] !== true);

  return (
    <>
      <meta name="title" content="Достижения" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          p: 2,
          overflow: 'auto',
        }}
      >
        {completedAccomplishments.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                mb: 2,
                color: 'text.primary',
              }}
            >
              Мои достижения
            </Typography>

            <Grid2 container spacing={2}>
              {completedAccomplishments.map((accomplishment) => (
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={accomplishment.id}>
                  <AccomplishmentItem accomplishment={accomplishment} completed={true} />
                </Grid2>
              ))}
            </Grid2>
          </Box>
        )}

        {pendingAccomplishments.length > 0 && (
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                mb: 2,
                color: 'text.primary',
              }}
            >
              Предстоит выполнить
            </Typography>

            <Grid2 container spacing={2}>
              {pendingAccomplishments.map((accomplishment) => (
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={accomplishment.id}>
                  <AccomplishmentItem accomplishment={accomplishment} completed={false} />
                </Grid2>
              ))}
            </Grid2>
          </Box>
        )}
      </Box>
    </>
  );
}

export default Accomplishments;
