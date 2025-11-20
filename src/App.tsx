import { Fragment } from 'react';
import { BrowserRouter } from 'react-router';

import { Box, CssBaseline } from '@mui/material';

import { withErrorHandler } from '@/error-handling';
import AppErrorBoundaryFallback from '@/error-handling/fallbacks/App';

import Pages from './routes/Pages';
import Header from './sections/Header';
import HotKeys from './sections/HotKeys';

function App() {
  return (
    <Fragment>
      <CssBaseline />
      <HotKeys />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ order: 2 }}>
            <Header />
          </Box>
          <Box sx={{ order: 1 }}>
            <Pages />
          </Box>
        </Box>
      </BrowserRouter>
    </Fragment>
  );
}

const AppWithErrorHandler = withErrorHandler(App, AppErrorBoundaryFallback);
export default AppWithErrorHandler;
