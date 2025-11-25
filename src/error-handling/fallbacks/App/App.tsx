import RestartIcon from '@mui/icons-material/RestartAlt';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { FullSizeCentered } from '@/components/styled';
import resetApp from '@/utils/reset-app';

function AppErrorBoundaryFallback() {
  return (
    <Box height={400}>
      <FullSizeCentered>
        <Paper sx={{ p: 5 }}>
          <Typography variant="h5" component="h3">
            Sorry, I guess, something went wrong.
          </Typography>
          <Typography component="h6">or</Typography>
          <Button startIcon={<RestartIcon />} sx={{ mt: 3 }} variant="outlined" onClick={resetApp}>
            Press here to reset the application
          </Button>
        </Paper>
      </FullSizeCentered>
    </Box>
  );
}

export default AppErrorBoundaryFallback;
